const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadBuffer, destroyImage } = require('../config/cloudinary');
const { getIO } = require('../sockets/socket');
const { escapeRegExp, parseCoordinates } = require('../utils/validation');
const { sendError } = require('../utils/http');

const CATEGORIES = ['Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];

function validateComplaintFields({ title, description, category, building }, partial = false) {
  if (!partial && (!title?.trim() || !description?.trim() || !category || !building?.trim() || building.trim() === 'Unknown')) {
    const error = new Error('Title, description, category and building are required');
    error.status = 400;
    throw error;
  }
  if (title !== undefined && (!title.trim() || title.trim().length > 120)) {
    const error = new Error('Title must be between 1 and 120 characters');
    error.status = 400;
    throw error;
  }
  if (description !== undefined && (!description.trim() || description.trim().length > 1000)) {
    const error = new Error('Description must be between 1 and 1000 characters');
    error.status = 400;
    throw error;
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    const error = new Error('Invalid category');
    error.status = 400;
    throw error;
  }
  if (building !== undefined && (!building.trim() || building.trim() === 'Unknown' || building.trim().length > 120)) {
    const error = new Error('A valid building is required');
    error.status = 400;
    throw error;
  }
}

exports.createComplaint = async (req, res) => {
  let uploadedPublicId = '';
  try {
    const { title, description, category, building, lat, lng } = req.body;
    validateComplaintFields({ title, description, category, building });
    const coordinates = parseCoordinates(lat, lng);

    const data = {
      title: title.trim(),
      description: description.trim(),
      category,
      building: building.trim(),
      coordinates,
      submittedBy: req.user._id,
    };

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer);
      uploadedPublicId = uploaded.public_id;
      data.imageUrl = uploaded.secure_url;
      data.imagePublicId = uploaded.public_id;
    }

    const complaint = await Complaint.create(data);
    await complaint.populate('submittedBy', 'name email department');

    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length) {
        await Notification.insertMany(admins.map((admin) => ({
          recipient: admin._id,
          message: `New complaint: "${complaint.title}" from ${req.user.name}`,
          complaintId: complaint._id,
          type: 'new_complaint',
        })));
        getIO().to('admins').emit('new_complaint', { complaint });
      }
    } catch (notificationError) {
      console.error('Notification error (non-fatal):', notificationError.message);
    }

    res.status(201).json({ success: true, complaint });
  } catch (err) {
    if (uploadedPublicId) {
      try { await destroyImage(uploadedPublicId); } catch (cleanupError) { console.error('Upload cleanup failed:', cleanupError.message); }
    }
    sendError(res, err);
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const { status, category, priority, sort = '-createdAt', search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { submittedBy: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search?.trim()) {
      const safeSearch = escapeRegExp(search.trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const allowedSorts = ['-createdAt', 'createdAt', '-updatedAt', 'updatedAt', '-priority'];
    const safeSort = allowedSorts.includes(sort) ? sort : '-createdAt';

    const [total, complaints, statusCounts] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .sort(safeSort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('submittedBy', 'name department'),
      Complaint.aggregate([
        { $match: { submittedBy: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    const stats = statusCounts.reduce((acc, item) => {
      if (item._id === 'Pending') acc.pending = item.count;
      if (item._id === 'In Progress') acc.inProgress = item.count;
      if (item._id === 'Resolved') acc.resolved = item.count;
      return acc;
    }, { total: await Complaint.countDocuments({ submittedBy: req.user._id }), pending: 0, inProgress: 0, resolved: 0 });

    res.json({ success: true, complaints, total, pages: Math.ceil(total / limit), stats });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email department')
      .populate('assignedAdmin', 'name email')
      .populate('comments.author', 'name role');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (req.user.role !== 'admin' && complaint.submittedBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, complaint });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateComplaint = async (req, res) => {
  let newUpload = null;
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (complaint.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot edit a complaint that is already in progress or resolved' });
    }

    const { title, description, category, building, lat, lng, removeImage } = req.body;
    validateComplaintFields({ title, description, category, building }, true);
    const coordinatesProvided = [lat, lng].some((value) => value !== undefined);
    const coordinates = coordinatesProvided ? parseCoordinates(lat, lng) : null;

    if (req.file) newUpload = await uploadBuffer(req.file.buffer);

    if (title !== undefined) complaint.title = title.trim();
    if (description !== undefined) complaint.description = description.trim();
    if (category !== undefined) complaint.category = category;
    if (building !== undefined) complaint.building = building.trim();
    if (coordinates) complaint.coordinates = coordinates;

    const oldPublicId = complaint.imagePublicId;
    if (newUpload) {
      complaint.imageUrl = newUpload.secure_url;
      complaint.imagePublicId = newUpload.public_id;
    } else if (String(removeImage).toLowerCase() === 'true') {
      complaint.imageUrl = '';
      complaint.imagePublicId = '';
    }

    await complaint.save();
    if (oldPublicId && (newUpload || String(removeImage).toLowerCase() === 'true')) {
      try { await destroyImage(oldPublicId); } catch (cleanupError) { console.error('Old image cleanup failed:', cleanupError.message); }
    }
    await complaint.populate('submittedBy', 'name email department');
    res.json({ success: true, complaint });
  } catch (err) {
    if (newUpload?.public_id) {
      try { await destroyImage(newUpload.public_id); } catch (cleanupError) { console.error('Upload cleanup failed:', cleanupError.message); }
    }
    sendError(res, err);
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (complaint.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending complaints can be deleted' });
    }

    await Promise.all([
      complaint.deleteOne(),
      Notification.deleteMany({ complaintId: complaint._id }),
    ]);
    if (complaint.imagePublicId) {
      try { await destroyImage(complaint.imagePublicId); } catch (cleanupError) { console.error('Image cleanup failed:', cleanupError.message); }
    }
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.addComment = async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });
    if (text.length > 500) return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (req.user.role !== 'admin' && complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    complaint.comments.push({ author: req.user._id, text });
    await complaint.save();
    await complaint.populate('comments.author', 'name role');
    res.json({ success: true, comments: complaint.comments });
  } catch (err) {
    sendError(res, err);
  }
};

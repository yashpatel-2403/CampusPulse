const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../sockets/socket');
const { destroyImage } = require('../config/cloudinary');
const { escapeRegExp, isValidObjectId } = require('../utils/validation');
const { sendError } = require('../utils/http');

// Bug #7 fix: whitelist allowed sort fields to prevent injection
const ALLOWED_SORTS = ['-createdAt', 'createdAt', '-updatedAt', 'updatedAt', '-priority', 'priority'];

exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, building, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const sort = ALLOWED_SORTS.includes(req.query.sort) ? req.query.sort : '-createdAt';

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (building) filter.building = { $regex: escapeRegExp(building.trim().slice(0, 100)), $options: 'i' };
    if (search && search.trim()) {
      const safeSearch = escapeRegExp(search.trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('submittedBy', 'name email department')
      .populate('assignedAdmin', 'name email');

    res.json({ success: true, complaints, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, inProgress, resolved, emergency] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ priority: 'Emergency', status: { $ne: 'Resolved' } }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Bug #25 fix: separate byPriority and byStatus aggregations
    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byBuilding = await Complaint.aggregate([
      { $group: { _id: '$building', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentComplaints = await Complaint.find()
      .sort('-createdAt')
      .limit(5)
      .populate('submittedBy', 'name department');

    const recentlyResolved = await Complaint.find({ status: 'Resolved' })
      .sort('-updatedAt')
      .limit(5)
      .populate('submittedBy', 'name department');

    const emergencyComplaints = await Complaint.find({ priority: 'Emergency', status: { $ne: 'Resolved' } })
      .sort('-createdAt')
      .limit(5)
      .populate('submittedBy', 'name department');

    res.json({
      success: true,
      stats: { total, pending, inProgress, resolved, emergency },
      monthly,
      byCategory,
      byPriority,
      byStatus,   // Bug #25 fix: now a separate field
      byBuilding,
      recentComplaints,
      recentlyResolved,
      emergencyComplaints,
    });
  } catch (err) {
    sendError(res, err);
  }
};

// Bug #9 fix: guard against null submittedBy before emitting socket event
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('submittedBy', 'name email');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Bug #9 fix: only notify if submittedBy exists
    if (complaint.submittedBy) {
      try {
        await Notification.create({
          recipient: complaint.submittedBy._id,
          message: `Your complaint "${complaint.title}" status changed to ${status}`,
          complaintId: complaint._id,
          type: 'status_update',
        });
        const io = getIO();
        io.to(`user_${complaint.submittedBy._id}`).emit('status_update', {
          complaintId: complaint._id,
          status: complaint.status,
          title: complaint.title,
        });
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr.message);
      }
    }

    res.json({ success: true, complaint });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    ).populate('submittedBy', 'name');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.submittedBy) {
      try {
        await Notification.create({
          recipient: complaint.submittedBy._id,
          message: `Your complaint "${complaint.title}" priority changed to ${priority}`,
          complaintId: complaint._id,
          type: 'priority_update',
        });
        getIO().to(`user_${complaint.submittedBy._id}`).emit('priority_update', {
          complaintId: complaint._id,
          priority: complaint.priority,
          title: complaint.title,
        });
      } catch (notificationError) {
        console.error('Notification error (non-fatal):', notificationError.message);
      }
    }
    res.json({ success: true, complaint });
  } catch (err) {
    sendError(res, err);
  }
};

exports.assignComplaint = async (req, res) => {
  try {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: 'adminId is required' });
    if (!isValidObjectId(adminId)) return res.status(400).json({ success: false, message: 'Invalid adminId' });

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedAdmin: adminId },
      { new: true }
    ).populate('assignedAdmin', 'name email');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, complaint });
  } catch (err) {
    sendError(res, err);
  }
};

// Bug #8 fix: check if complaint exists before deleting
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    await Promise.all([
      complaint.deleteOne(),
      Notification.deleteMany({ complaintId: complaint._id }),
    ]);
    if (complaint.imagePublicId) {
      try { await destroyImage(complaint.imagePublicId); } catch (cleanupError) { console.error('Image cleanup failed:', cleanupError.message); }
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      'coordinates.lat': { $ne: null },
      'coordinates.lng': { $ne: null },
    }).select('coordinates building priority status title');
    res.json({ success: true, complaints });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email').sort('name');
    res.json({ success: true, admins });
  } catch (err) {
    sendError(res, err);
  }
};

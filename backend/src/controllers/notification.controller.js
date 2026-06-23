const Notification = require('../models/Notification');
const { sendError } = require('../utils/http');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(30)
      .populate('complaintId', 'title status');
    const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, notifications, unread });
  } catch (err) {
    sendError(res, err);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const visible = await Notification.find({ recipient: req.user._id, read: false })
      .sort('-createdAt')
      .limit(30)
      .select('_id');
    await Notification.updateMany({ _id: { $in: visible.map((item) => item._id) } }, { read: true });
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

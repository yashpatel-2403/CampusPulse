const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['new_complaint', 'status_update', 'priority_update'], default: 'status_update' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

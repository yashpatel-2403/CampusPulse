const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  category: {
    type: String,
    required: true,
    enum: ['Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'],
  },
  building: { type: String, required: true, trim: true, maxlength: 120 },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  priority: { type: String, enum: ['Low','Medium','High','Emergency'], default: 'Low' },
  status: { type: String, enum: ['Pending','In Progress','Resolved'], default: 'Pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

complaintSchema.index({ title: 'text', description: 'text' });
complaintSchema.index({ status: 1, category: 1, priority: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);

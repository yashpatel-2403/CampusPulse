const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
}, { _id: false });

const campusConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'campus' },
  boundary: {
    type: [pointSchema],
    validate: {
      validator: (points) => points.length >= 3 && points.length <= 100,
      message: 'Boundary must contain between 3 and 100 points',
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('CampusConfig', campusConfigSchema);


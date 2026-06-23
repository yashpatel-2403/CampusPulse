const CampusConfig = require('../models/CampusConfig');
const { sendError } = require('../utils/http');

const DEFAULT_BOUNDARY = [
  { lat: 23.035306, lng: 72.544258 },
  { lat: 23.035728, lng: 72.548643 },
  { lat: 23.031532, lng: 72.549807 },
  { lat: 23.031288, lng: 72.544277 },
];

exports.getBoundary = async (req, res) => {
  try {
    const config = await CampusConfig.findOne({ key: 'campus' }).lean();
    res.json({ success: true, boundary: config?.boundary?.length >= 3 ? config.boundary : DEFAULT_BOUNDARY });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateBoundary = async (req, res) => {
  try {
    const { boundary } = req.body;
    if (!Array.isArray(boundary) || boundary.length < 3 || boundary.length > 100) {
      return res.status(400).json({ success: false, message: 'Boundary must contain between 3 and 100 points' });
    }

    const normalized = boundary.map((point) => ({ lat: Number(point?.lat), lng: Number(point?.lng) }));
    const invalid = normalized.some(({ lat, lng }) => (
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180
    ));
    if (invalid) {
      return res.status(400).json({ success: false, message: 'Boundary contains invalid coordinates' });
    }

    const config = await CampusConfig.findOneAndUpdate(
      { key: 'campus' },
      { $set: { boundary: normalized }, $setOnInsert: { key: 'campus' } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, boundary: config.boundary });
  } catch (err) {
    sendError(res, err);
  }
};

exports.DEFAULT_BOUNDARY = DEFAULT_BOUNDARY;


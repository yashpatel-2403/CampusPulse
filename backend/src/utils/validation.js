const mongoose = require('mongoose');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function parseCoordinates(latValue, lngValue) {
  const hasLat = latValue !== undefined && latValue !== null && latValue !== '';
  const hasLng = lngValue !== undefined && lngValue !== null && lngValue !== '';
  if (!hasLat && !hasLng) return { lat: null, lng: null };
  if (!hasLat || !hasLng) {
    const error = new Error('Latitude and longitude must be provided together');
    error.status = 400;
    throw error;
  }

  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    const error = new Error('Invalid latitude or longitude');
    error.status = 400;
    throw error;
  }
  return { lat, lng };
}

module.exports = { escapeRegExp, isValidObjectId, parseCoordinates };


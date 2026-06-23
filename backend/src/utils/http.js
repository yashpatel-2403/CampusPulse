function sendError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier' });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})[0]?.message || 'Invalid request data';
    return res.status(400).json({ success: false, message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with that value already exists' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = { sendError };


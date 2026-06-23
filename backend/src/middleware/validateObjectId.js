const { isValidObjectId } = require('../utils/validation');

module.exports = (param = 'id') => (req, res, next) => {
  if (!isValidObjectId(req.params[param])) {
    return res.status(400).json({ success: false, message: 'Invalid identifier' });
  }
  next();
};


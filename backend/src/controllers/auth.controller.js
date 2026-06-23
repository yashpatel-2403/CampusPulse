const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/http');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Bug #10 fix: validate all required fields before DB hit
exports.signup = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ success: false, message: 'Email is required' });
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) return res.status(400).json({ success: false, message: 'Password must be between 6 and 128 characters' });
    if (department !== undefined && typeof department !== 'string') return res.status(400).json({ success: false, message: 'Invalid department' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.length > 254 || !emailRegex.test(normalizedEmail)) return res.status(400).json({ success: false, message: 'Invalid email address' });

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, department: department?.trim() || '' });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    sendError(res, err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// Bug #11 fix: validate profilePhoto URL if provided
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, profilePhoto } = req.body;

    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    if (department !== undefined && typeof department !== 'string') return res.status(400).json({ success: false, message: 'Invalid department' });
    if (profilePhoto !== undefined && typeof profilePhoto !== 'string') return res.status(400).json({ success: false, message: 'Invalid profile photo URL' });

    // Validate profilePhoto URL if provided
    if (profilePhoto && profilePhoto.trim()) {
      try {
        const parsed = new URL(profilePhoto);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid profile photo URL' });
      }
    }

    const updateData = {
      name: name.trim(),
      department: department ? department.trim() : '',
      profilePhoto: profilePhoto ? profilePhoto.trim() : '',
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    sendError(res, err);
  }
};

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getAllowedOrigins } = require('./config/env');
// Bug #2 fix: removed unused `path` import

const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const configRoutes = require('./routes/config.routes');

const app = express();

const allowedOrigins = getAllowedOrigins();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    const error = new Error('Origin not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Bug #15 partial: handle multer errors specifically
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

module.exports = app;

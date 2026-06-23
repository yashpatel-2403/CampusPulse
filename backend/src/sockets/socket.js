const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAllowedOrigins } = require('../config/env');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    // Join personal room
    socket.join(`user_${user._id}`);
    // Admins join admin room
    if (user.role === 'admin') socket.join('admins');

    console.log(`✅ Socket connected: ${user.name} (${user.role})`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${user.name}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};

module.exports = { initSocket, getIO };

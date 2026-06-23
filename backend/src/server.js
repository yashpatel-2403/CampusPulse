require('dotenv').config(); // Must be first - fixes Bug #1
const { validateEnv } = require('./config/env');
validateEnv();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Bug #1 fix: connect DB first, then init socket, then listen
connectDB().then(() => {
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

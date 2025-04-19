// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const kafkaService = require('./services/kafka.service');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Routes
app.use('/api/kafka', require('./routes/kafka.routes'));
// app.use('/api/users', require('./routes/user.routes'));
// Add other routes as needed

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Register the socket for Kafka updates
  kafkaService.registerSocket(socket.id, socket);
  
  // Listen for client-side events
  socket.on('subscribe-topic', (topic) => {
    socket.join(`topic:${topic}`);
    console.log(`Socket ${socket.id} subscribed to topic: ${topic}`);
  });
  
  socket.on('unsubscribe-topic', (topic) => {
    socket.leave(`topic:${topic}`);
    console.log(`Socket ${socket.id} unsubscribed from topic: ${topic}`);
  });
  
  socket.on('disconnect', () => {
    kafkaService.unregisterSocket(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kafka-app')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize Kafka
kafkaService.initializeKafka(io)
  .then(() => {
    console.log('Kafka service initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize Kafka service:', err);
    // Continue running the server even if Kafka fails
  });

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  try {
    // Close Kafka connections
    await kafkaService.shutdown();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}
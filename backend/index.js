const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const snapsRoutes = require('./routes/snaps');
const moodsRoutes = require('./routes/moods');
const messagesRoutes = require('./routes/messages');
const savedPostsRoutes = require('./routes/savedPosts');
const notificationsRoutes = require('./routes/notifications');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add multiple origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/snaps', snapsRoutes);
app.use('/api/moods', moodsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/saved-posts', savedPostsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Sample Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Socialee Backend API is running!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Health check route with detailed database info
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbName = mongoose.connection.name;
    const dbHost = mongoose.connection.host;
    
    // Get collection stats
    let collections = {};
    if (dbState === 1) {
      try {
        const db = mongoose.connection.db;
        const collectionNames = await db.listCollections().toArray();
        
        for (const collection of collectionNames) {
          const stats = await db.collection(collection.name).countDocuments();
          collections[collection.name] = stats;
        }
      } catch (err) {
        console.error('Error getting collection stats:', err);
      }
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: {
        state: dbState === 1 ? 'Connected' : 'Disconnected',
        name: dbName,
        host: dbHost,
        collections: collections
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message
    });
  }
});

// Debug route to check what's in the database
app.get('/api/debug/data', async (req, res) => {
  try {
    const User = require('./models/User');
    const Post = require('./models/Post');
    const Snap = require('./models/Snap');
    const Mood = require('./models/Mood');
    const Message = require('./models/Message');
    const SavedPost = require('./models/SavedPost');
    const Notification = require('./models/Notification');
    
    const users = await User.find({}).select('-password');
    const posts = await Post.find({}).populate('author', 'name username');
    const snaps = await Snap.find({}).populate('author', 'name username');
    const moods = await Mood.find({}).populate('author', 'name username');
    const messages = await Message.find({}).populate('sender receiver', 'name username');
    const savedPosts = await SavedPost.find({}).populate('user post');
    const notifications = await Notification.find({}).populate('sender recipient', 'name username');
    
    res.json({
      users: users,
      posts: posts,
      snaps: snaps,
      moods: moods,
      messages: messages,
      savedPosts: savedPosts,
      notifications: notifications,
      userCount: users.length,
      postCount: posts.length,
      snapCount: snaps.length,
      moodCount: moods.length,
      messageCount: messages.length,
      savedPostCount: savedPosts.length,
      notificationCount: notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Socialee Backend Server...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`🌐 Frontend should connect to: http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🐛 Debug data: http://localhost:${PORT}/api/debug/data`);
      console.log(`📊 MongoDB: Check your 'socialee' database for stored data`);
      console.log(`⏰ Server started at: ${new Date().toISOString()}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port or stop the existing server.`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Start the application
startServer();
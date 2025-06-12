const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

// Sample Route
app.get('/', (req, res) => {
  res.json({ message: 'Socialee Backend API is running!' });
});

// Health check route with detailed database info
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection and collections
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
    
    const users = await User.find({}).select('-password');
    const posts = await Post.find({}).populate('author', 'name username');
    
    res.json({
      users: users,
      posts: posts,
      userCount: users.length,
      postCount: posts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB Compass
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🌐 Frontend should connect to: http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🐛 Debug data: http://localhost:${PORT}/api/debug/data`);
      console.log(`📊 MongoDB Compass: Check your 'socialee' database for stored data`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
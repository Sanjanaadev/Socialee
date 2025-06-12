const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Signup route
router.post('/signup', async (req, res) => {
  try {
    console.log('📝 Signup attempt:', { 
      name: req.body.name, 
      username: req.body.username, 
      email: req.body.email 
    });
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({ 
        error: 'Database connection error. Please try again later.' 
      });
    }
    
    const { name, username, email, password } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Additional validation
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object
    console.log('👤 Creating new user object...');
    const userData = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    };

    // Create and save user
    console.log('💾 Saving user to MongoDB...');
    const newUser = new User(userData);
    
    // Validate before saving
    const validationError = newUser.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({ 
        error: 'Validation failed: ' + Object.values(validationError.errors).map(e => e.message).join(', ')
      });
    }
    
    const savedUser = await newUser.save();
    console.log('✅ User saved successfully:', savedUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        profilePic: savedUser.profilePic,
        bio: savedUser.bio,
        followers: savedUser.followers,
        following: savedUser.following
      }
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    // Handle MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
      return res.status(500).json({ error: 'Database connection error. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Error signing up: ' + err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { username: req.body.username });
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({ 
        error: 'Database connection error. Please try again later.' 
      });
    }
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() }, 
        { email: username.toLowerCase() }
      ] 
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('👤 User found:', user.username);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for user:', username);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    
    // Handle MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
      return res.status(500).json({ error: 'Database connection error. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Error logging in: ' + err.message });
  }
});

module.exports = router;
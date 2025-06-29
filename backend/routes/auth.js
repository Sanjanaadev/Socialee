const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

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

    // Create user data object
    console.log('👤 Creating user data object...');
    const userData = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profilePic: '',
      bio: '',
      followers: [],
      following: [],
      isVerified: false
    };

    // Create and save user using User.create() instead of new User()
    console.log('💾 Saving user to MongoDB...');
    const savedUser = await User.create(userData);
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

// Forgot password route - Enhanced with better token management
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('🔑 Password reset request for:', req.body.username);
    
    const { username, email } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ 
        error: 'Username and email are required' 
      });
    }

    // Find user by username
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(404).json({ 
        error: 'No account found with this username' 
      });
    }

    // Check if the email matches the user's registered email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      console.log('❌ Email mismatch for user:', username);
      return res.status(400).json({ 
        error: 'The email address does not match the one associated with this username' 
      });
    }

    // Clear any existing password reset tokens for this user
    await PasswordReset.deleteMany({
      userId: user._id
    });
    console.log('🧹 Cleared existing password reset tokens for user');

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Create password reset record
    const passwordReset = new PasswordReset({
      userId: user._id,
      email: user.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false
    });

    await passwordReset.save();
    console.log('✅ Password reset token created for user:', username);

    // Send password reset email
    console.log('📧 Sending password reset email...');
    
    try {
      const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.name);
      console.log('✅ Password reset email process completed');
      
      const response = {
        message: 'Password reset email sent successfully!',
        emailSent: true,
        emailType: emailResult.emailType,
        service: emailResult.service,
        success: true
      };

      // Add preview URL for test emails
      if (emailResult.previewUrl) {
        response.previewUrl = emailResult.previewUrl;
        response.message = 'Password reset email sent! Check the preview link to view the email.';
      }

      // Add direct reset URL for fallback
      if (emailResult.resetUrl && emailResult.emailType === 'direct') {
        response.resetUrl = emailResult.resetUrl;
        response.message = 'Password reset link is ready! Use the direct link to reset your password.';
      }

      if (emailResult.note) {
        response.note = emailResult.note;
      }

      if (emailResult.error) {
        response.warning = `Email service issue: ${emailResult.error}`;
      }

      res.json(response);
      
    } catch (emailError) {
      console.error('⚠️ Email sending failed, providing working fallback:', emailError);
      
      // ALWAYS provide a working solution
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      res.json({
        message: 'Password reset link created successfully!',
        emailSent: false,
        resetUrl: resetUrl,
        note: 'Email service unavailable, but your reset link works perfectly!',
        emailType: 'direct',
        service: 'Direct Link',
        success: true,
        warning: emailError.message
      });
    }

  } catch (err) {
    console.error('❌ Password reset error:', err);
    res.status(500).json({ 
      error: 'Error processing password reset request: ' + err.message 
    });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🔄 Password reset attempt with token');
    
    const { token, newPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Reset token and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Find valid password reset token
    const passwordReset = await PasswordReset.findOne({
      token: token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!passwordReset) {
      console.log('❌ Invalid or expired password reset token');
      return res.status(400).json({ 
        error: 'Invalid or expired password reset token. Please request a new password reset.' 
      });
    }

    const user = passwordReset.userId;
    if (!user) {
      console.log('❌ User not found for password reset token');
      return res.status(404).json({ 
        error: 'User account not found' 
      });
    }

    // Hash new password
    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    });

    // Mark password reset token as used
    await PasswordReset.findByIdAndUpdate(passwordReset._id, { 
      used: true 
    });

    console.log('✅ Password reset successful for user:', user.username);

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
      success: true
    });

  } catch (err) {
    console.error('❌ Password reset error:', err);
    res.status(500).json({ error: 'Error resetting password: ' + err.message });
  }
});

// Verify reset token route
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const passwordReset = await PasswordReset.findOne({
      token: token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'name username email');

    if (!passwordReset) {
      return res.status(400).json({ 
        valid: false,
        error: 'Invalid or expired password reset token' 
      });
    }

    res.json({
      valid: true,
      user: {
        name: passwordReset.userId.name,
        username: passwordReset.userId.username,
        email: passwordReset.userId.email
      },
      expiresAt: passwordReset.expiresAt
    });

  } catch (err) {
    console.error('❌ Token verification error:', err);
    res.status(500).json({ 
      valid: false,
      error: 'Error verifying token' 
    });
  }
});

// Change password route
router.put('/change-password', auth, async (req, res) => {
  try {
    console.log('🔐 Password change attempt for user:', req.userId);
    
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(req.userId, { password: hashedNewPassword });

    console.log('✅ Password changed successfully for user:', req.userId);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Password change error:', err);
    res.status(500).json({ error: 'Error changing password: ' + err.message });
  }
});

module.exports = router;
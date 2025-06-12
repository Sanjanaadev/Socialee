const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('👤 Getting profile for user:', userId);
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'name username profilePic')
      .populate('following', 'name username profilePic');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile found for user:', user.username);
    res.json(user);
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ error: 'Error fetching user profile: ' + err.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('✏️ Updating profile for user:', req.userId);
    const { name, username, email, bio, profilePic } = req.body;
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (username) updateData.username = username.trim().toLowerCase();
    if (email) updateData.email = email.trim().toLowerCase();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile updated successfully');
    res.json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Error updating profile: ' + err.message });
  }
});

// Follow user
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    console.log('👥 Follow request:', currentUserId, '->', userId);

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to following/followers using MongoDB operations
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $push: { followers: currentUserId }
    });

    console.log('✅ User followed successfully');
    res.json({ message: 'User followed successfully' });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ error: 'Error following user: ' + err.message });
  }
});

// Unfollow user
router.post('/:userId/unfollow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    console.log('👥 Unfollow request:', currentUserId, '->', userId);

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from following/followers using MongoDB operations
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId }
    });

    console.log('✅ User unfollowed successfully');
    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ error: 'Error unfollowing user: ' + err.message });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Searching users with query:', q);
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name username profilePic bio')
    .limit(10);

    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Error searching users: ' + err.message });
  }
});

module.exports = router;
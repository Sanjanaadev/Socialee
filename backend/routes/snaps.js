const express = require('express');
const router = express.Router();
const Snap = require('../models/Snap');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyFollowersOfNewPost } = require('../utils/notifications');

// Create a new snap
router.post('/', auth, async (req, res) => {
  try {
    console.log('📸 Creating new snap for user:', req.userId);
    const { mediaUrl, caption, mediaType } = req.body;

    // Validate input
    if (!mediaUrl) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    // Verify user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newSnap = new Snap({
      mediaUrl,
      caption: caption?.trim() || '',
      mediaType: mediaType || 'image',
      author: req.userId,
      views: [],
      reactions: []
    });

    const savedSnap = await newSnap.save();
    
    // Populate author details with error handling
    await savedSnap.populate('author', 'name username profilePic');

    // Ensure populated data exists
    if (!savedSnap.author) {
      console.error('Failed to populate author for snap:', savedSnap._id);
      return res.status(500).json({ error: 'Failed to create snap - author data missing' });
    }

    // Notify followers of new snap
    try {
      await notifyFollowersOfNewPost(req.userId, savedSnap._id, 'snap');
    } catch (notifyError) {
      console.error('Error notifying followers:', notifyError);
      // Don't fail the snap creation if notification fails
    }

    console.log('✅ Snap created successfully:', savedSnap._id);
    res.status(201).json(savedSnap);
  } catch (err) {
    console.error('Create snap error:', err);
    res.status(500).json({ error: 'Error creating snap: ' + err.message });
  }
});

// Get snaps from followed users (feed)
router.get('/feed', auth, async (req, res) => {
  try {
    console.log('📱 Getting snaps feed for user:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get snaps from followed users and own snaps
    const followingIds = [...(user.following || []), req.userId];
    console.log('👥 Getting snaps from users:', followingIds.length);
    
    const snaps = await Snap.find({ 
      author: { $in: followingIds },
      expiresAt: { $gt: new Date() } // Only non-expired snaps
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter out snaps with missing author data
    const validSnaps = snaps.filter(snap => snap.author);

    console.log(`✅ Found ${validSnaps.length} snaps for feed`);
    res.json(validSnaps);
  } catch (err) {
    console.error('Get snaps feed error:', err);
    res.status(500).json({ error: 'Error fetching snaps: ' + err.message });
  }
});

// Get user's snaps
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📸 Getting snaps for user:', userId);
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const snaps = await Snap.find({ 
      author: userId,
      expiresAt: { $gt: new Date() } // Only non-expired snaps
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 });

    // Filter out snaps with missing author data
    const validSnaps = snaps.filter(snap => snap.author);

    console.log(`✅ Found ${validSnaps.length} snaps for user`);
    res.json(validSnaps);
  } catch (err) {
    console.error('Get user snaps error:', err);
    res.status(500).json({ error: 'Error fetching snaps: ' + err.message });
  }
});

// View a snap (add to views)
router.post('/:snapId/view', auth, async (req, res) => {
  try {
    const { snapId } = req.params;
    const userId = req.userId;

    console.log('👁️ Viewing snap:', snapId, 'by user:', userId);

    const snap = await Snap.findById(snapId);
    if (!snap) {
      return res.status(404).json({ error: 'Snap not found' });
    }

    // Ensure views array exists
    if (!snap.views) {
      snap.views = [];
    }

    // Check if user already viewed this snap
    const alreadyViewed = snap.views.some(view => view.user && view.user.toString() === userId);
    
    if (!alreadyViewed) {
      snap.views.push({ user: userId });
      await snap.save();
    }

    await snap.populate('author', 'name username profilePic');

    console.log('✅ Snap viewed successfully');
    res.json(snap);
  } catch (err) {
    console.error('View snap error:', err);
    res.status(500).json({ error: 'Error viewing snap: ' + err.message });
  }
});

// React to a snap (like/unlike)
router.post('/:snapId/react', auth, async (req, res) => {
  try {
    const { snapId } = req.params;
    const { reaction } = req.body; // 'like', 'love', 'laugh', etc.
    const userId = req.userId;

    console.log('😍 Reacting to snap:', snapId, 'with:', reaction);

    const snap = await Snap.findById(snapId);
    if (!snap) {
      return res.status(404).json({ error: 'Snap not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!snap.reactions) {
      snap.reactions = [];
    }

    // Check if user already reacted
    const existingReactionIndex = snap.reactions.findIndex(r => r.user && r.user.toString() === userId);
    
    if (existingReactionIndex > -1) {
      // Update existing reaction or remove if same reaction
      if (snap.reactions[existingReactionIndex].type === reaction) {
        snap.reactions.splice(existingReactionIndex, 1);
      } else {
        snap.reactions[existingReactionIndex].type = reaction;
      }
    } else {
      // Add new reaction
      snap.reactions.push({ user: userId, type: reaction });
    }

    await snap.save();
    await snap.populate('author', 'name username profilePic');

    console.log('✅ Snap reaction updated successfully');
    res.json(snap);
  } catch (err) {
    console.error('React to snap error:', err);
    res.status(500).json({ error: 'Error reacting to snap: ' + err.message });
  }
});

// Delete a snap
router.delete('/:snapId', auth, async (req, res) => {
  try {
    const { snapId } = req.params;
    const userId = req.userId;

    console.log('🗑️ Deleting snap:', snapId, 'by user:', userId);

    const snap = await Snap.findById(snapId);
    if (!snap) {
      return res.status(404).json({ error: 'Snap not found' });
    }

    // Check if user owns the snap
    if (snap.author.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this snap' });
    }

    await Snap.findByIdAndDelete(snapId);
    
    console.log('✅ Snap deleted successfully');
    res.json({ message: 'Snap deleted successfully' });
  } catch (err) {
    console.error('Delete snap error:', err);
    res.status(500).json({ error: 'Error deleting snap: ' + err.message });
  }
});

module.exports = router;
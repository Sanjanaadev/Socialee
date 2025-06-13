const express = require('express');
const router = express.Router();
const Snap = require('../models/Snap');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new snap
router.post('/', auth, async (req, res) => {
  try {
    console.log('📸 Creating new snap for user:', req.userId);
    const { mediaUrl, caption, mediaType } = req.body;

    // Validate input
    if (!mediaUrl) {
      return res.status(400).json({ error: 'Media URL is required' });
    }

    const newSnap = new Snap({
      mediaUrl,
      caption: caption?.trim() || '',
      mediaType: mediaType || 'image',
      author: req.userId
    });

    const savedSnap = await newSnap.save();
    
    // Populate author details
    await savedSnap.populate('author', 'name username profilePic');

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
    const followingIds = [...user.following, req.userId];
    console.log('👥 Getting snaps from users:', followingIds.length);
    
    const snaps = await Snap.find({ 
      author: { $in: followingIds },
      expiresAt: { $gt: new Date() } // Only non-expired snaps
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${snaps.length} snaps for feed`);
    res.json(snaps);
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
    
    const snaps = await Snap.find({ 
      author: userId,
      expiresAt: { $gt: new Date() } // Only non-expired snaps
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${snaps.length} snaps for user`);
    res.json(snaps);
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

    // Check if user already viewed this snap
    const alreadyViewed = snap.views.some(view => view.user.toString() === userId);
    
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

// Delete a snap
router.delete('/:snapId', auth, async (req, res) => {
  try {
    const { snapId } = req.params;
    const userId = req.userId;

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
const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new mood
router.post('/', auth, async (req, res) => {
  try {
    console.log('💭 Creating new mood for user:', req.userId);
    const { text, mood, backgroundColor, textColor } = req.body;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Mood text is required' });
    }

    if (text.trim().length > 280) {
      return res.status(400).json({ error: 'Mood text cannot exceed 280 characters' });
    }

    const newMood = new Mood({
      text: text.trim(),
      author: req.userId,
      mood: mood || 'neutral',
      backgroundColor: backgroundColor || '#FF2E93',
      textColor: textColor || '#FFFFFF'
    });

    const savedMood = await newMood.save();
    
    // Populate author details
    await savedMood.populate('author', 'name username profilePic');

    console.log('✅ Mood created successfully:', savedMood._id);
    res.status(201).json(savedMood);
  } catch (err) {
    console.error('Create mood error:', err);
    res.status(500).json({ error: 'Error creating mood: ' + err.message });
  }
});

// Get moods from followed users (feed)
router.get('/feed', auth, async (req, res) => {
  try {
    console.log('💭 Getting moods feed for user:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get moods from followed users and own moods
    const followingIds = [...user.following, req.userId];
    console.log('👥 Getting moods from users:', followingIds.length);
    
    const moods = await Mood.find({ 
      author: { $in: followingIds }
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${moods.length} moods for feed`);
    res.json(moods);
  } catch (err) {
    console.error('Get moods feed error:', err);
    res.status(500).json({ error: 'Error fetching moods: ' + err.message });
  }
});

// Get user's moods
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('💭 Getting moods for user:', userId);
    
    const moods = await Mood.find({ author: userId })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${moods.length} moods for user`);
    res.json(moods);
  } catch (err) {
    console.error('Get user moods error:', err);
    res.status(500).json({ error: 'Error fetching moods: ' + err.message });
  }
});

// Like/unlike a mood
router.post('/:moodId/like', auth, async (req, res) => {
  try {
    const { moodId } = req.params;
    const userId = req.userId;

    console.log('❤️ Like/unlike mood:', moodId, 'by user:', userId);

    const mood = await Mood.findById(moodId);
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    const isLiked = mood.likes.includes(userId);
    
    if (isLiked) {
      mood.likes = mood.likes.filter(id => id.toString() !== userId);
    } else {
      mood.likes.push(userId);
    }

    await mood.save();
    await mood.populate('author', 'name username profilePic');

    console.log(`✅ Mood ${isLiked ? 'unliked' : 'liked'} successfully`);

    res.json({ 
      likes: mood.likes.length, 
      isLiked: !isLiked,
      mood 
    });
  } catch (err) {
    console.error('Like mood error:', err);
    res.status(500).json({ error: 'Error liking mood: ' + err.message });
  }
});

// Delete a mood
router.delete('/:moodId', auth, async (req, res) => {
  try {
    const { moodId } = req.params;
    const userId = req.userId;

    const mood = await Mood.findById(moodId);
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    // Check if user owns the mood
    if (mood.author.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this mood' });
    }

    await Mood.findByIdAndDelete(moodId);
    
    console.log('✅ Mood deleted successfully');
    res.json({ message: 'Mood deleted successfully' });
  } catch (err) {
    console.error('Delete mood error:', err);
    res.status(500).json({ error: 'Error deleting mood: ' + err.message });
  }
});

module.exports = router;
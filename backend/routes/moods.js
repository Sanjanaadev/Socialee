const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyFollowersOfNewPost, notifyPostInteraction } = require('../utils/notifications');

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

    // Verify user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newMood = new Mood({
      text: text.trim(),
      author: req.userId,
      mood: mood || 'neutral',
      backgroundColor: backgroundColor || '#FF2E93',
      textColor: textColor || '#FFFFFF',
      likes: [],
      comments: []
    });

    const savedMood = await newMood.save();
    
    // Populate author details with error handling
    await savedMood.populate('author', 'name username profilePic');

    // Ensure populated data exists
    if (!savedMood.author) {
      console.error('Failed to populate author for mood:', savedMood._id);
      return res.status(500).json({ error: 'Failed to create mood - author data missing' });
    }

    // Notify followers of new mood
    try {
      await notifyFollowersOfNewPost(req.userId, savedMood._id, 'mood');
    } catch (notifyError) {
      console.error('Error notifying followers:', notifyError);
      // Don't fail the mood creation if notification fails
    }

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
    const followingIds = [...(user.following || []), req.userId];
    console.log('👥 Getting moods from users:', followingIds.length);
    
    const moods = await Mood.find({ 
      author: { $in: followingIds }
    })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter out moods with missing author data
    const validMoods = moods.filter(mood => mood.author);

    console.log(`✅ Found ${validMoods.length} moods for feed`);
    res.json(validMoods);
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
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const moods = await Mood.find({ author: userId })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 });

    // Filter out moods with missing author data
    const validMoods = moods.filter(mood => mood.author);

    console.log(`✅ Found ${validMoods.length} moods for user`);
    res.json(validMoods);
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

    // Ensure likes array exists
    if (!mood.likes) {
      mood.likes = [];
    }

    const isLiked = mood.likes.includes(userId);
    
    if (isLiked) {
      mood.likes = mood.likes.filter(id => id.toString() !== userId);
      console.log('👎 Mood unliked');
    } else {
      mood.likes.push(userId);
      console.log('👍 Mood liked');
      
      // Create notification for mood author (only when liking, not unliking)
      if (mood.author.toString() !== userId) {
        const user = await User.findById(userId);
        if (user) {
          console.log('📢 Creating like notification for mood author:', mood.author);
          await notifyPostInteraction(mood.author, userId, 'like', null, user.name, { relatedMood: moodId });
        }
      }
    }

    await mood.save();
    await mood.populate('author', 'name username profilePic');
    await mood.populate('comments.author', 'name username profilePic');

    console.log(`✅ Mood ${isLiked ? 'unliked' : 'liked'} successfully`);

    res.json({ 
      likes: mood.likes ? mood.likes.length : 0, 
      isLiked: !isLiked,
      mood 
    });
  } catch (err) {
    console.error('Like mood error:', err);
    res.status(500).json({ error: 'Error liking mood: ' + err.message });
  }
});

// Add comment to mood
router.post('/:moodId/comments', auth, async (req, res) => {
  try {
    const { moodId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log('💬 Adding comment to mood:', moodId, 'by user:', userId);

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
    }

    const mood = await Mood.findById(moodId);
    if (!mood) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    // Ensure comments array exists
    if (!mood.comments) {
      mood.comments = [];
    }

    const newComment = {
      text: text.trim(),
      author: userId,
      createdAt: new Date()
    };

    mood.comments.push(newComment);
    await mood.save();
    
    // Populate the entire mood with all necessary data
    await mood.populate('author', 'name username profilePic');
    await mood.populate('comments.author', 'name username profilePic');
    
    const addedComment = mood.comments[mood.comments.length - 1];
    
    // Create notification for mood author
    if (mood.author._id.toString() !== userId) {
      const user = await User.findById(userId);
      if (user) {
        console.log('📢 Creating comment notification for mood author:', mood.author._id);
        await notifyPostInteraction(mood.author._id, userId, 'comment', null, user.name, { relatedMood: moodId });
      }
    }
    
    console.log('✅ Comment added successfully to mood:', moodId);
    res.status(201).json(addedComment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Error adding comment: ' + err.message });
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
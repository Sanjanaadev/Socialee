const express = require('express');
const router = express.Router();
const SavedPost = require('../models/SavedPost');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Save a post
router.post('/:postId/save', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    console.log('💾 Saving post:', postId, 'for user:', userId);

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already saved
    const existingSave = await SavedPost.findOne({ user: userId, post: postId });
    if (existingSave) {
      return res.status(400).json({ error: 'Post already saved' });
    }

    // Create saved post
    const savedPost = new SavedPost({
      user: userId,
      post: postId
    });

    await savedPost.save();

    console.log('✅ Post saved successfully');
    res.status(201).json({ message: 'Post saved successfully', saved: true });
  } catch (err) {
    console.error('Save post error:', err);
    res.status(500).json({ error: 'Error saving post: ' + err.message });
  }
});

// Unsave a post
router.delete('/:postId/save', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    console.log('🗑️ Unsaving post:', postId, 'for user:', userId);

    const savedPost = await SavedPost.findOneAndDelete({ user: userId, post: postId });
    if (!savedPost) {
      return res.status(404).json({ error: 'Saved post not found' });
    }

    console.log('✅ Post unsaved successfully');
    res.json({ message: 'Post unsaved successfully', saved: false });
  } catch (err) {
    console.error('Unsave post error:', err);
    res.status(500).json({ error: 'Error unsaving post: ' + err.message });
  }
});

// Get user's saved posts
router.get('/saved', auth, async (req, res) => {
  try {
    const userId = req.userId;

    console.log('📖 Getting saved posts for user:', userId);

    const savedPosts = await SavedPost.find({ user: userId })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'name username profilePic'
        }
      })
      .sort({ createdAt: -1 });

    // Filter out any saved posts where the post was deleted
    const validSavedPosts = savedPosts.filter(savedPost => savedPost.post);

    console.log(`✅ Found ${validSavedPosts.length} saved posts`);
    res.json(validSavedPosts.map(savedPost => savedPost.post));
  } catch (err) {
    console.error('Get saved posts error:', err);
    res.status(500).json({ error: 'Error fetching saved posts: ' + err.message });
  }
});

// Check if post is saved
router.get('/:postId/saved', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const savedPost = await SavedPost.findOne({ user: userId, post: postId });
    
    res.json({ saved: !!savedPost });
  } catch (err) {
    console.error('Check saved post error:', err);
    res.status(500).json({ error: 'Error checking saved post: ' + err.message });
  }
});

module.exports = router;
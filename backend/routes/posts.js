const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;

    const newPost = new Post({
      imageUrl,
      caption,
      author: req.userId
    });

    await newPost.save();
    await newPost.populate('author', 'name username profilePic');

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const posts = await Post.find({ author: userId })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Get feed posts (posts from followed users)
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get posts from followed users and own posts
    const followingIds = [...user.following, req.userId];
    
    const posts = await Post.find({ author: { $in: followingIds } })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error('Get feed posts error:', err);
    res.status(500).json({ error: 'Error fetching feed' });
  }
});

// Like/unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await post.populate('author', 'name username profilePic');

    res.json({ 
      likes: post.likes.length, 
      isLiked: !isLiked,
      post 
    });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Error liking post' });
  }
});

// Add comment to post
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = {
      text,
      author: userId,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    
    await post.populate('comments.author', 'name username profilePic');
    
    const addedComment = post.comments[post.comments.length - 1];
    res.status(201).json(addedComment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Error adding comment' });
  }
});

module.exports = router;
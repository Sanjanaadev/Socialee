const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyFollowersOfNewPost, notifyPostInteraction } = require('../utils/notifications');

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating new post for user:', req.userId);
    const { imageUrl, caption } = req.body;

    // Validate input
    if (!imageUrl || !caption) {
      return res.status(400).json({ error: 'Image URL and caption are required' });
    }

    if (caption.trim().length === 0) {
      return res.status(400).json({ error: 'Caption cannot be empty' });
    }

    const newPost = new Post({
      imageUrl,
      caption: caption.trim(),
      author: req.userId
    });

    const savedPost = await newPost.save();
    
    // Populate author details
    await savedPost.populate('author', 'name username profilePic');

    // Notify followers of new post
    console.log('📢 About to notify followers of new post');
    await notifyFollowersOfNewPost(req.userId, savedPost._id, 'post');

    console.log('✅ Post created successfully:', savedPost._id);
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Error creating post: ' + err.message });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📖 Getting posts for user:', userId);
    
    const posts = await Post.find({ author: userId, isArchived: false })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${posts.length} posts for user`);
    res.json(posts);
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ error: 'Error fetching posts: ' + err.message });
  }
});

// Get feed posts (posts from followed users)
router.get('/feed', auth, async (req, res) => {
  try {
    console.log('📰 Getting feed for user:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get posts from followed users and own posts
    const followingIds = [...user.following, req.userId];
    console.log('👥 Getting posts from users:', followingIds.length);
    
    const posts = await Post.find({ 
      author: { $in: followingIds },
      isArchived: false 
    })
      .populate('author', 'name username profilePic')
      .populate('comments.author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${posts.length} posts for feed`);
    res.json(posts);
  } catch (err) {
    console.error('Get feed posts error:', err);
    res.status(500).json({ error: 'Error fetching feed: ' + err.message });
  }
});

// Like/unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    console.log('❤️ Like/unlike post:', postId, 'by user:', userId);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
      console.log('👎 Post unliked');
    } else {
      post.likes.push(userId);
      console.log('👍 Post liked');
      
      // Create notification for post author (only when liking, not unliking)
      if (post.author.toString() !== userId) {
        const user = await User.findById(userId);
        console.log('📢 Creating like notification for post author:', post.author);
        await notifyPostInteraction(post.author, userId, 'like', postId, user.name);
      }
    }

    await post.save();
    await post.populate('author', 'name username profilePic');

    console.log(`✅ Post ${isLiked ? 'unliked' : 'liked'} successfully`);

    res.json({ 
      likes: post.likes.length, 
      isLiked: !isLiked,
      post 
    });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Error liking post: ' + err.message });
  }
});

// Add comment to post
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log('💬 Adding comment to post:', postId);

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = {
      text: text.trim(),
      author: userId,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    
    // Populate the new comment's author
    await post.populate('comments.author', 'name username profilePic');
    
    const addedComment = post.comments[post.comments.length - 1];
    
    // Create notification for post author
    if (post.author.toString() !== userId) {
      const user = await User.findById(userId);
      console.log('📢 Creating comment notification for post author:', post.author);
      await notifyPostInteraction(post.author, userId, 'comment', postId, user.name);
    }
    
    console.log('✅ Comment added successfully');
    res.status(201).json(addedComment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Error adding comment: ' + err.message });
  }
});

// Delete a post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    
    console.log('✅ Post deleted successfully');
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Error deleting post: ' + err.message });
  }
});

module.exports = router;
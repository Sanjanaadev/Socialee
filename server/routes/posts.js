import express from 'express';
import Post from '../models/Post.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    const post = new Post({
      imageUrl,
      caption,
      author: req.user.userId
    });
    await post.save();
    await post.populate('author');
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author')
      .populate('comments.author')
      .sort('-createdAt');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const index = post.likes.indexOf(req.user.userId);
    
    if (index === -1) {
      post.likes.push(req.user.userId);
    } else {
      post.likes.splice(index, 1);
    }
    
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    post.comments.push({
      text,
      author: req.user.userId
    });
    
    await post.save();
    await post.populate('comments.author');
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
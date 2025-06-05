const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup route
router.post('/signup', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const newUser = new User({ name, username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created!' });
  } catch (err) {
    res.status(500).json({ error: 'Error signing up' });
  }
});

module.exports = router;

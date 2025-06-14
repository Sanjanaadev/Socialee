const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Getting notifications for user:', req.userId);
    
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'name username profilePic')
      .populate('relatedPost', 'imageUrl caption')
      .populate('relatedSnap', 'mediaUrl caption')
      .populate('relatedMood', 'text')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Error fetching notifications: ' + err.message });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Error fetching unread count: ' + err.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log('✅ Notification marked as read');
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ error: 'Error marking notification as read: ' + err.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );

    console.log('✅ All notifications marked as read');
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications as read error:', err);
    res.status(500).json({ error: 'Error marking all notifications as read: ' + err.message });
  }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log('✅ Notification deleted');
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Error deleting notification: ' + err.message });
  }
});

module.exports = router;
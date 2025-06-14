const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyMessage } = require('../utils/notifications');

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    console.log('📤 Sending message from user:', req.userId);
    const { receiverId, text } = req.body;

    // Validate input
    if (!receiverId || !text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Receiver ID and message text are required' });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({ error: 'Message cannot exceed 1000 characters' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.userId, receiverId);

    // Create message
    const newMessage = new Message({
      sender: req.userId,
      receiver: receiverId,
      text: text.trim(),
      conversationId
    });

    const savedMessage = await newMessage.save();
    
    // Populate sender and receiver details
    await savedMessage.populate('sender', 'name username profilePic');
    await savedMessage.populate('receiver', 'name username profilePic');

    // Create notification for receiver
    const sender = await User.findById(req.userId);
    await notifyMessage(receiverId, req.userId, sender.name);

    console.log('✅ Message sent successfully:', savedMessage._id);
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Error sending message: ' + err.message });
  }
});

// Get conversation messages
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    console.log('💬 Getting conversation between:', currentUserId, 'and', userId);

    // Generate conversation ID
    const conversationId = Message.generateConversationId(currentUserId, userId);

    // Get messages for this conversation
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name username profilePic')
      .populate('receiver', 'name username profilePic')
      .sort({ createdAt: 1 }); // Oldest first for chat display

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      { 
        conversationId,
        receiver: currentUserId,
        read: false 
      },
      { read: true }
    );

    console.log(`✅ Found ${messages.length} messages in conversation`);
    res.json(messages);
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Error fetching conversation: ' + err.message });
  }
});

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    console.log('📋 Getting conversations for user:', req.userId);

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.userId },
        { receiver: req.userId }
      ]
    })
    .populate('sender', 'name username profilePic')
    .populate('receiver', 'name username profilePic')
    .sort({ createdAt: -1 });

    // Group messages by conversation and get the latest message for each
    const conversationsMap = new Map();
    
    messages.forEach(message => {
      const conversationId = message.conversationId;
      
      if (!conversationsMap.has(conversationId)) {
        // Determine the other participant
        const otherParticipant = message.sender._id.toString() === req.userId 
          ? message.receiver 
          : message.sender;
        
        conversationsMap.set(conversationId, {
          conversationId,
          otherParticipant,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    // Calculate unread count for each conversation
    for (const [conversationId, conversation] of conversationsMap) {
      const unreadCount = await Message.countDocuments({
        conversationId,
        receiver: req.userId,
        read: false
      });
      conversation.unreadCount = unreadCount;
    }

    // Convert map to array and sort by last message time
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    console.log(`✅ Found ${conversations.length} conversations`);
    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Error fetching conversations: ' + err.message });
  }
});

// Mark conversation as read
router.put('/conversation/:userId/read', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const conversationId = Message.generateConversationId(currentUserId, userId);

    await Message.updateMany(
      { 
        conversationId,
        receiver: currentUserId,
        read: false 
      },
      { read: true }
    );

    console.log('✅ Conversation marked as read');
    res.json({ message: 'Conversation marked as read' });
  } catch (err) {
    console.error('Mark conversation as read error:', err);
    res.status(500).json({ error: 'Error marking conversation as read: ' + err.message });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Get unread message count error:', err);
    res.status(500).json({ error: 'Error fetching unread message count: ' + err.message });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    
    console.log('✅ Message deleted successfully');
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Error deleting message: ' + err.message });
  }
});

module.exports = router;
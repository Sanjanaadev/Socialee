const Notification = require('../models/Notification');
const User = require('../models/User');

// Create notification helper function
const createNotification = async (recipientId, senderId, type, message, relatedData = {}) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    const notificationData = {
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      ...relatedData
    };

    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log(`📢 Notification created: ${type} for user ${recipientId}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create notifications for followers when user posts
const notifyFollowersOfNewPost = async (authorId, postId, postType = 'post') => {
  try {
    const author = await User.findById(authorId).populate('followers', '_id');
    if (!author || !author.followers.length) return;

    const notifications = author.followers.map(follower => ({
      recipient: follower._id,
      sender: authorId,
      type: postType,
      message: `${author.name} shared a new ${postType}`,
      ...(postType === 'post' && { relatedPost: postId }),
      ...(postType === 'snap' && { relatedSnap: postId }),
      ...(postType === 'mood' && { relatedMood: postId })
    }));

    await Notification.insertMany(notifications);
    console.log(`📢 Created ${notifications.length} notifications for new ${postType}`);
  } catch (error) {
    console.error('Error notifying followers:', error);
  }
};

// Create notification for post interaction
const notifyPostInteraction = async (postAuthorId, senderId, type, postId, senderName, extraData = {}) => {
  try {
    let message = '';
    switch (type) {
      case 'like':
        message = `${senderName} liked your ${extraData.relatedMood ? 'mood' : 'post'}`;
        break;
      case 'comment':
        message = `${senderName} commented on your ${extraData.relatedMood ? 'mood' : 'post'}`;
        break;
      default:
        message = `${senderName} interacted with your ${extraData.relatedMood ? 'mood' : 'post'}`;
    }

    const notificationData = {
      ...(postId && { relatedPost: postId }),
      ...extraData
    };

    await createNotification(postAuthorId, senderId, type, message, notificationData);
  } catch (error) {
    console.error('Error creating post interaction notification:', error);
  }
};

// Create notification for follow
const notifyFollow = async (followedUserId, followerId, followerName) => {
  try {
    await createNotification(
      followedUserId,
      followerId,
      'follow',
      `${followerName} started following you`
    );
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
};

// Create notification for message
const notifyMessage = async (recipientId, senderId, senderName) => {
  try {
    await createNotification(
      recipientId,
      senderId,
      'message',
      `${senderName} sent you a message`
    );
  } catch (error) {
    console.error('Error creating message notification:', error);
  }
};

module.exports = {
  createNotification,
  notifyFollowersOfNewPost,
  notifyPostInteraction,
  notifyFollow,
  notifyMessage
};
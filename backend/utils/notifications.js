const Notification = require('../models/Notification');
const User = require('../models/User');

// Create notification helper function
const createNotification = async (recipientId, senderId, type, message, relatedData = {}) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    // Check if a similar notification already exists (to avoid spam)
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      ...relatedData,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (existingNotification && ['like'].includes(type)) {
      // Update existing like notification instead of creating new one
      existingNotification.createdAt = new Date();
      existingNotification.read = false;
      await existingNotification.save();
      console.log(`📢 Updated existing ${type} notification for user ${recipientId}`);
      return existingNotification;
    }

    const notificationData = {
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      read: false,
      ...relatedData
    };

    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log(`📢 Notification created: ${type} for user ${recipientId} - ${message}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create notifications for followers when user posts
const notifyFollowersOfNewPost = async (authorId, postId, postType = 'post') => {
  try {
    const author = await User.findById(authorId).populate('followers', '_id name');
    if (!author || !author.followers.length) {
      console.log('No followers to notify for new post');
      return;
    }

    console.log(`📢 Notifying ${author.followers.length} followers of new ${postType}`);

    const notifications = author.followers.map(follower => ({
      recipient: follower._id,
      sender: authorId,
      type: postType,
      message: `${author.name} shared a new ${postType}`,
      read: false,
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
    // Don't notify if user is interacting with their own content
    if (postAuthorId.toString() === senderId.toString()) {
      return;
    }

    let message = '';
    switch (type) {
      case 'like':
        if (extraData.relatedMood) {
          message = `${senderName} liked your mood`;
        } else if (extraData.relatedSnap) {
          message = `${senderName} liked your snap`;
        } else {
          message = `${senderName} liked your post`;
        }
        break;
      case 'comment':
        if (extraData.relatedMood) {
          message = `${senderName} commented on your mood`;
        } else if (extraData.relatedSnap) {
          message = `${senderName} commented on your snap`;
        } else {
          message = `${senderName} commented on your post`;
        }
        break;
      default:
        message = `${senderName} interacted with your content`;
    }

    const notificationData = {
      ...(postId && { relatedPost: postId }),
      ...extraData
    };

    await createNotification(postAuthorId, senderId, type, message, notificationData);
    console.log(`📢 Created ${type} notification for ${postAuthorId}: ${message}`);
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
    console.log(`📢 Created follow notification for ${followedUserId}`);
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
    console.log(`📢 Created message notification for ${recipientId}`);
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
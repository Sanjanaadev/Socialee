import axios from 'axios';
import { User, Post } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increase timeout to 15 seconds
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('socialee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔐 Token expired, redirecting to login');
      localStorage.removeItem('socialee_token');
      localStorage.removeItem('socialee_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Login successful');
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  signup: async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/signup', { name, username, email, password });
      console.log('✅ Signup successful');
      return response.data;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  },

  forgotPassword: async (username: string, email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { username, email });
      console.log('✅ Forgot password request successful');
      return response.data;
    } catch (error) {
      console.error('❌ Forgot password request failed:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      console.log('✅ Password reset successful');
      return response.data;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  },

  verifyResetToken: async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-reset-token/${token}`);
      console.log('✅ Token verification successful');
      return response.data;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const response = await api.put('/auth/change-password', { oldPassword, newPassword });
      console.log('✅ Password change successful');
      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  },
};

// Posts API calls
export const postsAPI = {
  createPost: async (postData: { imageUrl: string; caption: string }) => {
    try {
      console.log('📝 Creating post:', { caption: postData.caption.substring(0, 50) + '...' });
      const response = await api.post('/posts', postData);
      console.log('✅ Post created successfully:', response.data);
      
      // Ensure the response has proper array initialization
      const post = response.data;
      return {
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : []
      };
    } catch (error) {
      console.error('❌ Post creation failed:', error);
      throw error;
    }
  },

  getUserPosts: async (userId: string) => {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      console.log(`✅ Loaded ${response.data.length} posts for user ${userId}`);
      
      // Ensure all posts have proper array initialization
      return response.data.map((post: any) => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : []
      }));
    } catch (error) {
      console.error('❌ Failed to load user posts:', error);
      throw error;
    }
  },

  getFeedPosts: async () => {
    try {
      const response = await api.get('/posts/feed');
      console.log(`✅ Loaded ${response.data.length} feed posts`);
      
      // Ensure all posts have proper array initialization
      return response.data.map((post: any) => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : []
      }));
    } catch (error) {
      console.error('❌ Failed to load feed posts:', error);
      throw error;
    }
  },

  likePost: async (postId: string) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      console.log('✅ Post like/unlike successful');
      return response.data;
    } catch (error) {
      console.error('❌ Post like/unlike failed:', error);
      throw error;
    }
  },

  addComment: async (postId: string, text: string) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { text });
      console.log('✅ Comment added successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Comment addition failed:', error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      console.log('✅ Post deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Post deletion failed:', error);
      throw error;
    }
  },
};

// Users API calls
export const usersAPI = {
  getProfile: async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      console.log(`✅ Loaded profile for user ${userId}`);
      
      // Ensure arrays are properly initialized
      const user = response.data;
      return {
        ...user,
        followers: Array.isArray(user.followers) ? user.followers : [],
        following: Array.isArray(user.following) ? user.following : []
      };
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', profileData);
      console.log('✅ Profile updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  },

  followUser: async (userId: string) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      console.log(`✅ User ${userId} followed successfully`);
      return response.data;
    } catch (error) {
      console.error('❌ Follow user failed:', error);
      throw error;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      const response = await api.post(`/users/${userId}/unfollow`);
      console.log(`✅ User ${userId} unfollowed successfully`);
      return response.data;
    } catch (error) {
      console.error('❌ Unfollow user failed:', error);
      throw error;
    }
  },

  searchUsers: async (query: string) => {
    try {
      const response = await api.get(`/users/search/users?q=${encodeURIComponent(query)}`);
      console.log(`✅ Found ${response.data.length} users for query: ${query}`);
      return response.data;
    } catch (error) {
      console.error('❌ User search failed:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/users/all/users');
      console.log(`✅ Loaded ${response.data.length} total users`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load all users:', error);
      throw error;
    }
  },
};

// Messages API calls
export const messagesAPI = {
  sendMessage: async (receiverId: string, text: string) => {
    try {
      console.log(`📤 Sending message to user ${receiverId}`);
      const response = await api.post('/messages/send', { receiverId, text });
      console.log('✅ Message sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Message send failed:', error);
      throw error;
    }
  },

  getConversation: async (userId: string) => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      console.log(`✅ Loaded conversation with user ${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load conversation:', error);
      throw error;
    }
  },

  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      console.log(`✅ Loaded ${response.data.length} conversations`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      throw error;
    }
  },

  markConversationAsRead: async (userId: string) => {
    try {
      const response = await api.put(`/messages/conversation/${userId}/read`);
      console.log(`✅ Conversation with user ${userId} marked as read`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to mark conversation as read:', error);
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      console.log('✅ Message deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Message deletion failed:', error);
      throw error;
    }
  },

  deleteConversation: async (userId: string) => {
    try {
      const response = await api.delete(`/messages/conversation/${userId}`);
      console.log('✅ Conversation deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Conversation deletion failed:', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get unread message count:', error);
      throw error;
    }
  },
};

// Saved Posts API calls
export const savedPostsAPI = {
  savePost: async (postId: string) => {
    try {
      const response = await api.post(`/saved-posts/${postId}/save`);
      console.log(`✅ Post ${postId} saved successfully`);
      return response.data;
    } catch (error) {
      console.error('❌ Save post failed:', error);
      throw error;
    }
  },

  unsavePost: async (postId: string) => {
    try {
      const response = await api.delete(`/saved-posts/${postId}/save`);
      console.log(`✅ Post ${postId} unsaved successfully`);
      return response.data;
    } catch (error) {
      console.error('❌ Unsave post failed:', error);
      throw error;
    }
  },

  getSavedPosts: async () => {
    try {
      const response = await api.get('/saved-posts/saved');
      console.log(`✅ Loaded ${response.data.length} saved posts`);
      
      // Ensure all posts have proper array initialization
      return response.data.map((post: any) => ({
        ...post,
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments : []
      }));
    } catch (error) {
      console.error('❌ Failed to load saved posts:', error);
      throw error;
    }
  },

  checkIfSaved: async (postId: string) => {
    try {
      const response = await api.get(`/saved-posts/${postId}/saved`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to check if post is saved:', error);
      throw error;
    }
  },
};

// Notifications API calls
export const notificationsAPI = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get unread notification count:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  },
};

// Snaps API calls
export const snapsAPI = {
  createSnap: async (snapData: { mediaUrl: string; caption?: string; mediaType: string }) => {
    try {
      console.log('📸 Creating snap');
      const response = await api.post('/snaps', snapData);
      console.log('✅ Snap created successfully');
      
      // Ensure the response has proper array initialization
      const snap = response.data;
      return {
        ...snap,
        views: Array.isArray(snap.views) ? snap.views : [],
        reactions: Array.isArray(snap.reactions) ? snap.reactions : []
      };
    } catch (error) {
      console.error('❌ Snap creation failed:', error);
      throw error;
    }
  },

  getFeedSnaps: async () => {
    try {
      const response = await api.get('/snaps/feed');
      console.log(`✅ Loaded ${response.data.length} snaps`);
      
      // Ensure all snaps have proper array initialization
      return response.data.map((snap: any) => ({
        ...snap,
        views: Array.isArray(snap.views) ? snap.views : [],
        reactions: Array.isArray(snap.reactions) ? snap.reactions : []
      }));
    } catch (error) {
      console.error('❌ Failed to load snaps:', error);
      throw error;
    }
  },

  getUserSnaps: async (userId: string) => {
    try {
      const response = await api.get(`/snaps/user/${userId}`);
      console.log(`✅ Loaded ${response.data.length} snaps for user ${userId}`);
      
      // Ensure all snaps have proper array initialization
      return response.data.map((snap: any) => ({
        ...snap,
        views: Array.isArray(snap.views) ? snap.views : [],
        reactions: Array.isArray(snap.reactions) ? snap.reactions : []
      }));
    } catch (error) {
      console.error('❌ Failed to load user snaps:', error);
      throw error;
    }
  },

  viewSnap: async (snapId: string) => {
    try {
      const response = await api.post(`/snaps/${snapId}/view`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to view snap:', error);
      throw error;
    }
  },

  reactToSnap: async (snapId: string, reaction: string) => {
    try {
      const response = await api.post(`/snaps/${snapId}/react`, { reaction });
      console.log(`✅ Reacted to snap with ${reaction}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to react to snap:', error);
      throw error;
    }
  },

  deleteSnap: async (snapId: string) => {
    try {
      const response = await api.delete(`/snaps/${snapId}`);
      console.log('✅ Snap deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Snap deletion failed:', error);
      throw error;
    }
  },
};

// Moods API calls
export const moodsAPI = {
  createMood: async (moodData: { text: string; mood: string; backgroundColor: string; textColor: string }) => {
    try {
      console.log('💭 Creating mood');
      const response = await api.post('/moods', moodData);
      console.log('✅ Mood created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Mood creation failed:', error);
      throw error;
    }
  },

  getFeedMoods: async () => {
    try {
      const response = await api.get('/moods/feed');
      console.log(`✅ Loaded ${response.data.length} moods`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load moods:', error);
      throw error;
    }
  },

  getUserMoods: async (userId: string) => {
    try {
      const response = await api.get(`/moods/user/${userId}`);
      console.log(`✅ Loaded ${response.data.length} moods for user ${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load user moods:', error);
      throw error;
    }
  },

  likeMood: async (moodId: string) => {
    try {
      const response = await api.post(`/moods/${moodId}/like`);
      console.log('✅ Mood like/unlike successful');
      return response.data;
    } catch (error) {
      console.error('❌ Mood like/unlike failed:', error);
      throw error;
    }
  },

  addComment: async (moodId: string, text: string) => {
    try {
      const response = await api.post(`/moods/${moodId}/comments`, { text });
      console.log('✅ Comment added to mood successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Comment addition to mood failed:', error);
      throw error;
    }
  },

  deleteMood: async (moodId: string) => {
    try {
      const response = await api.delete(`/moods/${moodId}`);
      console.log('✅ Mood deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Mood deletion failed:', error);
      throw error;
    }
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  },
};

export default api;
import axios from 'axios';
import { User, Post } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('socialee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('socialee_token');
      localStorage.removeItem('socialee_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  signup: async (name: string, username: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', { name, username, email, password });
    return response.data;
  },
};

// Posts API calls
export const postsAPI = {
  createPost: async (postData: { imageUrl: string; caption: string }) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  getUserPosts: async (userId: string) => {
    const response = await api.get(`/posts/user/${userId}`);
    return response.data;
  },

  getFeedPosts: async () => {
    const response = await api.get('/posts/feed');
    return response.data;
  },

  likePost: async (postId: string) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  addComment: async (postId: string, text: string) => {
    const response = await api.post(`/posts/${postId}/comments`, { text });
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};

// Users API calls
export const usersAPI = {
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (profileData: Partial<User>) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  followUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/unfollow`);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search/users?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/users/all/users');
    return response.data;
  },
};

// Messages API calls
export const messagesAPI = {
  sendMessage: async (receiverId: string, text: string) => {
    const response = await api.post('/messages/send', { receiverId, text });
    return response.data;
  },

  getConversation: async (userId: string) => {
    const response = await api.get(`/messages/conversation/${userId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  markConversationAsRead: async (userId: string) => {
    const response = await api.put(`/messages/conversation/${userId}/read`);
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },
};

// Saved Posts API calls
export const savedPostsAPI = {
  savePost: async (postId: string) => {
    const response = await api.post(`/saved-posts/${postId}/save`);
    return response.data;
  },

  unsavePost: async (postId: string) => {
    const response = await api.delete(`/saved-posts/${postId}/save`);
    return response.data;
  },

  getSavedPosts: async () => {
    const response = await api.get('/saved-posts/saved');
    return response.data;
  },

  checkIfSaved: async (postId: string) => {
    const response = await api.get(`/saved-posts/${postId}/saved`);
    return response.data;
  },
};

// Notifications API calls
export const notificationsAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

// Snaps API calls
export const snapsAPI = {
  createSnap: async (snapData: { mediaUrl: string; caption?: string; mediaType: string }) => {
    const response = await api.post('/snaps', snapData);
    return response.data;
  },

  getFeedSnaps: async () => {
    const response = await api.get('/snaps/feed');
    return response.data;
  },

  getUserSnaps: async (userId: string) => {
    const response = await api.get(`/snaps/user/${userId}`);
    return response.data;
  },

  viewSnap: async (snapId: string) => {
    const response = await api.post(`/snaps/${snapId}/view`);
    return response.data;
  },

  reactToSnap: async (snapId: string, reaction: string) => {
    const response = await api.post(`/snaps/${snapId}/react`, { reaction });
    return response.data;
  },

  deleteSnap: async (snapId: string) => {
    const response = await api.delete(`/snaps/${snapId}`);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
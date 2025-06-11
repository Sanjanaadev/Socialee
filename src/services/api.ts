import axios from 'axios';
import { User, Post } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('socialee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const response = await api.get(`/users/search?q=${query}`);
    return response.data;
  },
};

export default api;
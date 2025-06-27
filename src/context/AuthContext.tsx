import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { authAPI, usersAPI } from '../services/api';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  registeredUsers: User[];
  followingUsers: User[];
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, profilePic?: File) => Promise<void>;
  logout: () => void;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<string>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  searchUsers: (query: string) => Promise<User[]>;
  loadAllUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('socialee_token');
    const userData = localStorage.getItem('socialee_user');
    return token && userData ? JSON.parse(userData) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);

  // Load user data on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('socialee_token');
    if (token && user) {
      loadUserProfile();
      loadAllUsers();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      if (user) {
        const profileData = await usersAPI.getProfile(user.id);
        const updatedUser = {
          id: profileData._id,
          name: profileData.name,
          username: profileData.username,
          email: profileData.email,
          profilePic: profileData.profilePic || '',
          bio: profileData.bio || '',
          followers: profileData.followers?.length || 0,
          following: profileData.following?.length || 0,
          posts: 0 // Will be calculated from actual posts
        };
        setUser(updatedUser);
        setFollowingUsers(profileData.following || []);
        localStorage.setItem('socialee_user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await usersAPI.getAllUsers();
      const formattedUsers = users.map((user: any) => ({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email || '',
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        posts: 0
      }));
      setRegisteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      const { token, user: userData } = response;
      
      const formattedUser = {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        profilePic: userData.profilePic || '',
        bio: userData.bio || '',
        followers: userData.followers?.length || 0,
        following: userData.following?.length || 0,
        posts: 0
      };
      
      localStorage.setItem('socialee_token', token);
      localStorage.setItem('socialee_user', JSON.stringify(formattedUser));
      setUser(formattedUser);
      
      // Load following users
      if (userData.following) {
        setFollowingUsers(userData.following);
      }
      
      // Load all registered users
      await loadAllUsers();
      
      toast.success('Welcome back!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await authAPI.signup(name, username, email, password);
      toast.success('Account created successfully! Please log in.');
      
      // Reload all users to include the new user
      await loadAllUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedUser = await usersAPI.updateProfile(profileData);
      const formattedUser = {
        ...user,
        ...updatedUser,
        id: updatedUser._id || user.id,
        followers: updatedUser.followers?.length || user.followers,
        following: updatedUser.following?.length || user.following,
      };
      
      setUser(formattedUser);
      localStorage.setItem('socialee_user', JSON.stringify(formattedUser));
      
      // Reload all users to reflect the updated profile
      await loadAllUsers();
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      await authAPI.changePassword(oldPassword, newPassword);
      toast.success('Password updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update password';
      throw new Error(errorMessage);
    }
  };

  const updateProfilePicture = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      await usersAPI.followUser(userId);
      
      // Reload user profile to get updated following list
      await loadUserProfile();
      
      toast.success('User followed successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to follow user';
      toast.error(errorMessage);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      await usersAPI.unfollowUser(userId);
      
      // Reload user profile to get updated following list
      await loadUserProfile();
      
      toast.success('User unfollowed successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to unfollow user';
      toast.error(errorMessage);
    }
  };

  const isFollowing = (userId: string) => {
    return followingUsers.some(u => u._id === userId || u.id === userId);
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const users = await usersAPI.searchUsers(query);
      return users.map((user: any) => ({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email || '',
        profilePic: user.profilePic || '',
        bio: user.bio || '',
        followers: 0,
        following: 0,
        posts: 0
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const logout = () => {
    localStorage.removeItem('socialee_token');
    localStorage.removeItem('socialee_user');
    setUser(null);
    setFollowingUsers([]);
    setRegisteredUsers([]);
    toast.success('Logged out successfully!');
  };

  const value = {
    user,
    registeredUsers,
    followingUsers,
    login,
    signup,
    logout,
    followUser,
    unfollowUser,
    isFollowing,
    updateProfile,
    updateProfilePicture,
    updatePassword,
    isAuthenticated: !!user,
    searchUsers,
    loadAllUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
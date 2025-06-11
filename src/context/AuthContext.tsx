import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  registeredUsers: User[];
  followingUsers: User[];
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, profilePic?: File) => Promise<void>;
  logout: () => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<string>;
  isAuthenticated: boolean;
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

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('socialee_registered_users');
    return stored ? JSON.parse(stored) : [];
  });

  const [followingUsers, setFollowingUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('socialee_following_users');
    return stored ? JSON.parse(stored) : [];
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });
      
      const { token, user: loggedInUser } = response.data;
      
      // Add following and followers count from localStorage if exists
      const storedFollowing = localStorage.getItem(`socialee_following_${loggedInUser.id}`);
      const storedFollowers = localStorage.getItem(`socialee_followers_${loggedInUser.id}`);
      
      const updatedUser = {
        ...loggedInUser,
        following: storedFollowing ? JSON.parse(storedFollowing).length : 0,
        followers: storedFollowers ? JSON.parse(storedFollowers).length : 0
      };
      
      localStorage.setItem('socialee_token', token);
      localStorage.setItem('socialee_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Load following users for this user
      const followingList = localStorage.getItem(`socialee_following_${updatedUser.id}`);
      if (followingList) {
        setFollowingUsers(JSON.parse(followingList));
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Invalid credentials';
      throw new Error(message);
    }
  };

  const signup = async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        username,
        email,
        password
      });
      
      const { user: newUser } = response.data;
      
      // Add to registered users list
      const updatedRegisteredUsers = [...registeredUsers, newUser];
      setRegisteredUsers(updatedRegisteredUsers);
      localStorage.setItem('socialee_registered_users', JSON.stringify(updatedRegisteredUsers));
      
      // Initialize following/followers for new user
      localStorage.setItem(`socialee_following_${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`socialee_followers_${newUser.id}`, JSON.stringify([]));
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error creating account';
      throw new Error(message);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update user data
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('socialee_user', JSON.stringify(updatedUser));

      // Update in registered users list
      const updatedRegisteredUsers = registeredUsers.map(u => 
        u.id === user.id ? updatedUser : u
      );
      setRegisteredUsers(updatedRegisteredUsers);
      localStorage.setItem('socialee_registered_users', JSON.stringify(updatedRegisteredUsers));

      // Update in following users list if present
      const updatedFollowingUsers = followingUsers.map(u => 
        u.id === user.id ? updatedUser : u
      );
      setFollowingUsers(updatedFollowingUsers);
      localStorage.setItem(`socialee_following_${user.id}`, JSON.stringify(updatedFollowingUsers));

    } catch (error) {
      throw new Error('Failed to update profile');
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

  const followUser = (userId: string) => {
    if (!user) return;

    const userToFollow = registeredUsers.find(u => u.id === userId);
    if (!userToFollow) return;

    // Add to following list
    const updatedFollowing = [...followingUsers, userToFollow];
    setFollowingUsers(updatedFollowing);
    localStorage.setItem(`socialee_following_${user.id}`, JSON.stringify(updatedFollowing));

    // Update current user's following count
    const updatedUser = { ...user, following: updatedFollowing.length };
    setUser(updatedUser);
    localStorage.setItem('socialee_user', JSON.stringify(updatedUser));

    // Update followed user's followers count
    const currentFollowers = localStorage.getItem(`socialee_followers_${userId}`);
    const followersList = currentFollowers ? JSON.parse(currentFollowers) : [];
    const updatedFollowers = [...followersList, user];
    localStorage.setItem(`socialee_followers_${userId}`, JSON.stringify(updatedFollowers));

    // Update registered users list with new follower count
    const updatedRegisteredUsers = registeredUsers.map(u => 
      u.id === userId ? { ...u, followers: updatedFollowers.length } : u
    );
    setRegisteredUsers(updatedRegisteredUsers);
    localStorage.setItem('socialee_registered_users', JSON.stringify(updatedRegisteredUsers));
  };

  const unfollowUser = (userId: string) => {
    if (!user) return;

    // Remove from following list
    const updatedFollowing = followingUsers.filter(u => u.id !== userId);
    setFollowingUsers(updatedFollowing);
    localStorage.setItem(`socialee_following_${user.id}`, JSON.stringify(updatedFollowing));

    // Update current user's following count
    const updatedUser = { ...user, following: updatedFollowing.length };
    setUser(updatedUser);
    localStorage.setItem('socialee_user', JSON.stringify(updatedUser));

    // Update unfollowed user's followers count
    const currentFollowers = localStorage.getItem(`socialee_followers_${userId}`);
    const followersList = currentFollowers ? JSON.parse(currentFollowers) : [];
    const updatedFollowers = followersList.filter((follower: User) => follower.id !== user.id);
    localStorage.setItem(`socialee_followers_${userId}`, JSON.stringify(updatedFollowers));

    // Update registered users list with new follower count
    const updatedRegisteredUsers = registeredUsers.map(u => 
      u.id === userId ? { ...u, followers: updatedFollowers.length } : u
    );
    setRegisteredUsers(updatedRegisteredUsers);
    localStorage.setItem('socialee_registered_users', JSON.stringify(updatedRegisteredUsers));
  };

  const isFollowing = (userId: string) => {
    return followingUsers.some(u => u.id === userId);
  };

  const logout = () => {
    localStorage.removeItem('socialee_token');
    localStorage.removeItem('socialee_user');
    setUser(null);
    setFollowingUsers([]);
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
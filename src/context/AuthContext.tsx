import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, profilePic?: File) => Promise<void>;
  logout: () => void;
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

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('socialee_token', token);
      localStorage.setItem('socialee_user', JSON.stringify(user));
      setUser(user);
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
      
      const { token, user } = response.data;
      localStorage.setItem('socialee_token', token);
      localStorage.setItem('socialee_user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error creating account';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('socialee_token');
    localStorage.removeItem('socialee_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { currentUser } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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
    return token ? currentUser : null;
  });

  const login = async (email: string, password: string) => {
    // In a real app, this would call your API
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          localStorage.setItem('socialee_token', 'mock-jwt-token');
          setUser(currentUser);
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  const signup = async (name: string, username: string, email: string, password: string, profilePic?: File) => {
    // In a real app, this would call your API
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (name && username && email && password) {
          // In a real app, you would create a user and return it
          resolve();
        } else {
          reject(new Error('All fields are required'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    localStorage.removeItem('socialee_token');
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
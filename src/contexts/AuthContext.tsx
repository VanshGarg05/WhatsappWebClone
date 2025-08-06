'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.status === 200) {
        const { user: userData, token: userToken } = response.data;
        
        // Convert the user data format to match our interface
        const formattedUser = {
          _id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          isOnline: userData.isOnline,
          lastSeen: userData.lastSeen,
          createdAt: userData.createdAt || new Date()
        };
        
        setUser(formattedUser);
        setToken(userToken);
        
        // Save to localStorage
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(formattedUser));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        toast.success(`Welcome back, ${userData.name}!`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/signup', { name, email, password });
      
      if (response.status === 201) {
        const { user: userData, token: userToken } = response.data;
        
        // Convert the user data format to match our interface
        const formattedUser = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          isOnline: userData.isOnline,
          lastSeen: userData.lastSeen,
          createdAt: userData.createdAt || new Date()
        };
        
        setUser(formattedUser);
        setToken(userToken);
        
        // Save to localStorage
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(formattedUser));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        toast.success(`Welcome to WhatsApp Web, ${userData.name}!`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API to update user status
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove default authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  sendMessage: (receiverId: string, message: string) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      console.log('Connecting to Socket.IO with token:', token.substring(0, 20) + '...');
      
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        path: '/api/socket',
        auth: {
          token
        },
        autoConnect: true,
        forceNew: true,
        transports: ['polling', 'websocket']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // User status events
      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => prev.filter(userId => userId !== data.userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      };
    }
  }, [isAuthenticated, token, user]);

  const sendMessage = (receiverId: string, message: string) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', {
        receiverId,
        message,
        messageType: 'text'
      });
    }
  };

  const value: SocketContextType = {
    socket,
    onlineUsers,
    sendMessage,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

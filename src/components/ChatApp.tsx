'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import NewSidebar from './NewSidebar';
import NewChatContainer from './NewChatContainer';
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

interface ChatMessage {
  _id: string;
  sender: User;
  receiver: User;
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
}

interface UnreadCount {
  userId: string;
  unreadCount: number;
  senderName: string;
}

const ChatApp: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  
  const { user: currentUser, token } = useAuth();
  const { socket, sendMessage: socketSendMessage, onlineUsers, isConnected } = useSocket();
  
  // Refs to access current values in socket handlers
  const selectedUserRef = useRef<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const fetchUnreadCountsRef = useRef<(() => Promise<void>) | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when values change
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch unread message counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await axios.get('/api/chat/unread-counts');
      if (response.data.success) {
        setUnreadCounts(response.data.unreadCounts);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchUnreadCountsRef.current = fetchUnreadCounts;
  }, [fetchUnreadCounts]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (userId: string) => {
    try {
      await axios.post(`/api/chat/${userId}/mark-read`);
      // Update unread counts after marking as read
      setUnreadCounts(prev => prev.filter(uc => uc.userId !== userId));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Fetch messages between current user and selected user
  const fetchMessages = useCallback(async (userId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await axios.get(`/api/chat/${userId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        // Mark messages as read when opening chat
        markMessagesAsRead(userId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [markMessagesAsRead]);

  // Handle user selection
  const handleSelectUser = useCallback((user: User) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  }, [fetchMessages]);

  // Send message via socket
  const handleSendMessage = useCallback((message: string) => {
    if (selectedUser && socket && isConnected) {
      socketSendMessage(selectedUser._id, message);
    }
  }, [selectedUser, socket, isConnected, socketSendMessage]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Handle received messages
      const handleReceiveMessage = (messageData: ChatMessage) => {
        const currentSelectedUser = selectedUserRef.current;
        const currentUserData = currentUserRef.current;
        
        // Check if this message is for the current conversation
        const isCurrentConversation = 
          (messageData.sender._id === currentSelectedUser?._id && messageData.receiver._id === currentUserData?._id) ||
          (messageData.receiver._id === currentSelectedUser?._id && messageData.sender._id === currentUserData?._id);
        
        if (isCurrentConversation) {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.find(msg => msg._id === messageData._id);
            if (exists) return prev;
            return [...prev, messageData];
          });
        }
        
        // Refresh unread counts when receiving a message from someone else
        if (messageData.sender._id !== currentUserData?._id && currentSelectedUser?._id !== messageData.sender._id) {
          // Clear existing timeout
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          // Set new timeout to debounce multiple rapid message updates
          debounceTimeoutRef.current = setTimeout(() => {
            if (fetchUnreadCountsRef.current) {
              fetchUnreadCountsRef.current();
            }
          }, 500); // Increased timeout to 500ms
        }
        
        // Show notification if message is from someone else
        if (messageData.sender._id !== currentUserData?._id) {
          toast.success(`New message from ${messageData.sender.name}`, {
            duration: 3000,
          });
        }
      };

      // Handle sent messages confirmation
      const handleMessageSent = (messageData: ChatMessage) => {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.find(msg => msg._id === messageData._id);
          if (exists) return prev;
          return [...prev, messageData];
        });
      };

      // Handle message read receipts
      const handleMessageRead = (data: { messageId: string; readBy: string; readAt: Date }) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isRead: true } 
              : msg
          )
        );
      };

      // Add event listeners
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('messageSent', handleMessageSent);
      socket.on('messageRead', handleMessageRead);

      // Cleanup
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('messageSent', handleMessageSent);
        socket.off('messageRead', handleMessageRead);
      };
    }
  }, [socket]);

  // Update user online status based on socket events
  useEffect(() => {
    if (socket) {
      const handleUserOnline = (data: { userId: string; userName: string; isOnline: boolean }) => {
        setUsers(prev => 
          prev.map(user => 
            user._id === data.userId 
              ? { ...user, isOnline: data.isOnline }
              : user
          )
        );
      };

      const handleUserOffline = (data: { userId: string; userName: string; isOnline: boolean; lastSeen: Date }) => {
        setUsers(prev => 
          prev.map(user => 
            user._id === data.userId 
              ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
              : user
          )
        );
      };

      socket.on('userOnline', handleUserOnline);
      socket.on('userOffline', handleUserOffline);

      return () => {
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
      };
    }
  }, [socket]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchUnreadCounts();
  }, [fetchUsers, fetchUnreadCounts]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 border-r border-gray-600">
        <NewSidebar
          users={users}
          currentUser={currentUser!}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onlineUsers={onlineUsers}
          isLoading={isLoadingUsers}
          isConnected={isConnected}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col">
        <NewChatContainer
          selectedUser={selectedUser}
          currentUser={currentUser!}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessages}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default ChatApp;

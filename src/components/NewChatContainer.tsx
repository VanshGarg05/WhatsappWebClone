'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import NewMessageBubble from './NewMessageBubble';
import { formatMessageTime } from '@/lib/utils';

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

interface NewChatContainerProps {
  selectedUser: User | null;
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

const NewChatContainer: React.FC<NewChatContainerProps> = ({
  selectedUser,
  currentUser,
  messages,
  onSendMessage,
  isLoading,
  isConnected
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (selectedUser) {
      inputRef.current?.focus();
    }
  }, [selectedUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !selectedUser || isSending || !isConnected) return;

    setIsSending(true);
    try {
      onSendMessage(inputText.trim());
      setInputText('');
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Handle typing indicator (you can implement this with socket later)
    if (!isTyping) {
      setIsTyping(true);
      // You can emit typing event to socket here
    }
    
    // Clear typing after user stops typing
    clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = setTimeout(() => {
      setIsTyping(false);
      // You can emit stop typing event to socket here
    }, 1000);
  };

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'last seen just now';
    if (minutes < 60) return `last seen ${minutes}m ago`;
    if (hours < 24) return `last seen ${hours}h ago`;
    return `last seen ${days}d ago`;
  };

  // Show empty state when no conversation is selected
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center max-w-md px-6">
          <div className="w-32 h-32 mx-auto mb-8 bg-gray-800 rounded-full flex items-center justify-center">
            <MessageCircle size={64} color="#9ca3af" />
          </div>
          <h1 className="text-2xl font-light mb-4 text-white">WhatsApp Web</h1>
          <p className="text-sm leading-6 mb-4">
            Send and receive messages without keeping your phone online.
          </p>
          <p className="text-xs text-gray-500">
            Select a user from the sidebar to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar name={selectedUser.name} size="md" />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
              selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
          </div>
          <div>
            <h2 className="text-white font-medium">{selectedUser.name}</h2>
            <p className="text-gray-400 text-sm">
              {selectedUser.isOnline ? 'online' : formatLastSeen(selectedUser.lastSeen)}
            </p>
          </div>
        </div>
        
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={40} color="#9ca3af" />
              </div>
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation with {selectedUser.name}!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <NewMessageBubble
              key={message._id}
              message={message}
              isFromCurrentUser={message.sender._id === currentUser._id}
              currentUser={currentUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-yellow-600 text-white text-center py-2 text-sm">
          Connecting... Messages will be sent when connection is restored.
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-600">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message" : "Connecting..."}
              disabled={isSending || !isConnected}
              className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-full border-none outline-none focus:bg-gray-600 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending || !isConnected}
            className="p-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-full transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};


export default NewChatContainer;

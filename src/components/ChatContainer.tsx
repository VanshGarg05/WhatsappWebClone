'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, VideoIcon, Search, MoreVertical, Smile, Paperclip, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import { formatMessageTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  id?: string;
  wa_id: string;
  from: string;
  to?: string;
  type: string;
  text?: string;
  image?: any;
  document?: any;
  audio?: any;
  video?: any;
  location?: any;
  status: string;
  timestamp: number;
  isFromUser: boolean;
  contact?: {
    profile?: {
      name: string;
    };
    wa_id: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ChatContainerProps {
  conversation?: {
    wa_id: string;
    name: string;
  };
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (wa_id: string, text: string) => Promise<void>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  conversation,
  messages,
  isLoading,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      inputRef.current?.focus();
    }
  }, [conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !conversation || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(conversation.wa_id, inputText.trim());
      setInputText('');
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
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

  // Show empty state when no conversation is selected
  if (!conversation) {
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
            Select a conversation from the sidebar to start messaging.
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
          <Avatar name={conversation.name} size="md" />
          <div>
            <h2 className="text-white font-medium">{conversation.name}</h2>
            <p className="text-gray-400 text-sm">+{conversation.wa_id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <VideoIcon size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
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
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isFromUser={message.isFromUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-600">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <Smile size={20} />
          </button>
          
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              disabled={isSending}
              className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-full border-none outline-none focus:bg-gray-600 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
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


export default ChatContainer;

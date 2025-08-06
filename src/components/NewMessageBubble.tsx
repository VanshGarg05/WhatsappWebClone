'use client';

import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';

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

interface NewMessageBubbleProps {
  message: ChatMessage;
  isFromCurrentUser: boolean;
  currentUser: User;
}

const NewMessageBubble: React.FC<NewMessageBubbleProps> = ({
  message,
  isFromCurrentUser,
  currentUser
}) => {
  const formatTime = (date: Date) => {
    try {
      return format(new Date(date), 'HH:mm');
    } catch {
      return format(new Date(), 'HH:mm');
    }
  };

  const getStatusIcon = () => {
    if (!isFromCurrentUser) return null;

    if (message.isRead) {
      return <CheckCheck size={14} className="text-blue-400" />;
    } else {
      return <Check size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[65%] rounded-lg px-3 py-2 ${
          isFromCurrentUser
            ? 'bg-green-700 text-white ml-auto'
            : 'bg-gray-700 text-white mr-auto'
        }`}
      >
        {/* Message Content */}
        <div className="message-bubble">
          {message.messageType === 'text' ? (
            <p className="text-white whitespace-pre-wrap break-words">{message.message}</p>
          ) : (
            <div className="flex items-center space-x-2 p-2 bg-gray-600 rounded">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-xs">📎</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">File</p>
                <p className="text-xs text-gray-300">{message.messageType}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Time and Status */}
        <div className={`flex items-center justify-end space-x-1 mt-1 ${
          message.messageType === 'text' ? 'float-right ml-2' : ''
        }`}>
          <span className="text-gray-300 text-xs">
            {formatTime(message.createdAt)}
          </span>
          {getStatusIcon()}
        </div>
        
        {message.messageType === 'text' && <div className="clear-both" />}
      </div>
    </div>
  );
};

export default NewMessageBubble;

'use client';

import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { formatMessageTime } from '@/lib/utils';

interface Message {
  _id: string;
  id?: string;
  type: string;
  text?: string;
  image?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    filename?: string;
    mime_type?: string;
    caption?: string;
  };
  audio?: {
    id?: string;
    mime_type?: string;
    voice?: boolean;
  };
  video?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  status: string;
  timestamp: number;
  isFromUser: boolean;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  isFromUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isFromUser }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-400" />;
      case 'failed':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="message-bubble">
            <p className="text-white whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        );

      case 'image':
        return (
          <div className="message-bubble">
            {message.image?.caption && (
              <>
                <div className="bg-gray-600 rounded-lg p-3 mb-2 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📷</span>
                  </div>
                  <span className="text-white text-sm">Image</span>
                </div>
                <p className="text-white whitespace-pre-wrap break-words">{message.image.caption}</p>
              </>
            )}
            {!message.image?.caption && (
              <div className="bg-gray-600 rounded-lg p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📷</span>
                </div>
                <div>
                  <p className="text-white font-medium">Image</p>
                  <p className="text-gray-300 text-sm">{message.image?.mime_type || 'image/*'}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="message-bubble">
            <div className="bg-gray-600 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {message.document?.filename || 'Document'}
                </p>
                <p className="text-gray-300 text-sm">{message.document?.mime_type}</p>
              </div>
            </div>
            {message.document?.caption && (
              <p className="text-white mt-2 whitespace-pre-wrap break-words">{message.document.caption}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="message-bubble">
            <div className="bg-gray-600 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">{message.audio?.voice ? '🎙️' : '🎵'}</span>
              </div>
              <div>
                <p className="text-white font-medium">
                  {message.audio?.voice ? 'Voice Message' : 'Audio'}
                </p>
                <p className="text-gray-300 text-sm">{message.audio?.mime_type}</p>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="message-bubble">
            <div className="bg-gray-600 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🎥</span>
              </div>
              <div>
                <p className="text-white font-medium">Video</p>
                <p className="text-gray-300 text-sm">{message.video?.mime_type}</p>
              </div>
            </div>
            {message.video?.caption && (
              <p className="text-white mt-2 whitespace-pre-wrap break-words">{message.video.caption}</p>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="message-bubble">
            <div className="bg-gray-600 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {message.location?.name || 'Location'}
                  </p>
                  {message.location?.address && (
                    <p className="text-gray-300 text-sm">{message.location.address}</p>
                  )}
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Lat: {message.location?.latitude}, Lng: {message.location?.longitude}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="message-bubble">
            <p className="text-white italic">Unsupported message type: {message.type}</p>
          </div>
        );
    }
  };

  return (
    <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[65%] rounded-lg px-3 py-2 ${
          isFromUser
            ? 'bg-green-700 text-white'
            : 'bg-gray-700 text-white'
        }`}
      >
        {renderMessageContent()}
        
        {/* Message time and status */}
        <div className={`flex items-center justify-end space-x-1 mt-1 ${
          message.type === 'text' ? 'float-right ml-2' : ''
        }`}>
          <span className="text-gray-300 text-xs">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromUser && (
            <div className="flex-shrink-0">
              {getStatusIcon(message.status)}
            </div>
          )}
        </div>
        
        {message.type === 'text' && <div className="clear-both" />}
      </div>
    </div>
  );
};

export default MessageBubble;

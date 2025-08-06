'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, MoreVertical } from 'lucide-react';
import Avatar from './Avatar';
import { formatConversationTime, getMessagePreview } from '@/lib/utils';

interface Conversation {
  wa_id: string;
  name: string;
  lastMessage: {
    _id: string;
    text?: string;
    type: string;
    timestamp: number;
    status: string;
    isFromUser: boolean;
    createdAt: string;
  };
  unreadCount: number;
}

interface SidebarProps {
  conversations: Conversation[];
  selectedConversation?: string;
  onSelectConversation: (wa_id: string) => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.wa_id.includes(searchTerm)
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-600">
        <Avatar name="WhatsApp Business" size="md" />
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <MessageCircle size={20} />
          </button>
          <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg border-none outline-none focus:bg-gray-600 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <MessageCircle size={48} className="mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start by processing webhook data</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.wa_id}
              onClick={() => onSelectConversation(conversation.wa_id)}
              className={`flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-600 ${
                selectedConversation === conversation.wa_id ? 'bg-gray-700' : ''
              }`}
            >
              <Avatar name={conversation.name} size="md" className="flex-shrink-0" />
              
              <div className="flex-1 min-w-0 ml-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium truncate">
                    {conversation.name}
                  </h3>
                  <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                    {formatConversationTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-400 text-sm truncate">
                    {conversation.lastMessage.isFromUser && '✓ '}
                    {getMessagePreview(conversation.lastMessage)}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center ml-2">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;

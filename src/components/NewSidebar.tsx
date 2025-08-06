'use client';

import React, { useState } from 'react';
import { Search, MessageCircle, MoreVertical, LogOut, User, Settings } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

interface UnreadCount {
  userId: string;
  unreadCount: number;
  senderName: string;
}

interface NewSidebarProps {
  users: User[];
  currentUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onlineUsers: string[];
  isLoading: boolean;
  isConnected: boolean;
  unreadCounts: UnreadCount[];
}

const NewSidebar: React.FC<NewSidebarProps> = ({
  users,
  currentUser,
  selectedUser,
  onSelectUser,
  onlineUsers,
  isLoading,
  isConnected,
  unreadCounts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const { logout } = useAuth();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="relative"
          >
            <Avatar name={currentUser.name} size="md" />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
          </button>
          <div className="hidden md:block">
            <h2 className="text-white font-medium">{currentUser.name}</h2>
            <p className="text-xs text-gray-400">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-50">
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <hr className="border-gray-600" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Panel */}
      {showProfile && (
        <div className="bg-gray-750 border-b border-gray-600 p-4">
          <div className="text-center">
            <Avatar name={currentUser.name} size="lg" className="mx-auto mb-3" />
            <h3 className="text-white font-medium text-lg">{currentUser.name}</h3>
            <p className="text-gray-400 text-sm">{currentUser.email}</p>
            <p className="text-gray-500 text-xs mt-1">
              Joined {new Date(currentUser.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => setShowProfile(false)}
              className="mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-750 border-b border-gray-600 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-lg">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm">Sound Notifications</label>
                <button 
                  onClick={() => setSoundNotifications(!soundNotifications)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    soundNotifications ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    soundNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm">Desktop Notifications</label>
                <button 
                  onClick={() => setDesktopNotifications(!desktopNotifications)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    desktopNotifications ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm">Show Online Status</label>
                <button 
                  onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    showOnlineStatus ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-gray-500 text-xs">Version: 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 bg-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg border-none outline-none focus:bg-gray-600 transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <MessageCircle size={48} className="mb-2 opacity-50" />
            <p>No users found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;
            const userUnreadCount = unreadCounts.find(uc => uc.userId === user._id)?.unreadCount || 0;
            
            return (
              <div
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-600 ${
                  isSelected ? 'bg-gray-700' : ''
                }`}
              >
                <div className="relative">
                  <Avatar name={user.name} size="md" className="flex-shrink-0" />
                  {showOnlineStatus && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {userUnreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                          {userUnreadCount}
                        </span>
                      )}
                      {showOnlineStatus && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isOnline ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                        }`}>
                          {isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Connection Status */}
      <div className="p-2 bg-gray-900 border-t border-gray-600">
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-400">
            {isConnected ? `Connected • ${filteredUsers.length} users` : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NewSidebar;

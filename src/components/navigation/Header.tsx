import { Search, Menu, Bell, User, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User as UserType } from '../../types';
import { notificationsAPI, messagesAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  toggleSidebar: () => void;
}

interface Notification {
  _id: string;
  type: string;
  message: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  read: boolean;
  createdAt: string;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, searchUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Search users from backend
  useEffect(() => {
    const searchUsersFromBackend = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        // Filter out current user from results
        const filteredResults = results.filter(u => u.id !== user?.id);
        setSearchResults(filteredResults);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchUsersFromBackend, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user, searchUsers]);

  // Load notifications and unread counts
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCounts();
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        loadUnreadCounts();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const notificationsData = await notificationsAPI.getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const [notificationCount, messageCount] = await Promise.all([
        notificationsAPI.getUnreadCount(),
        messagesAPI.getUnreadCount()
      ]);
      
      setUnreadNotificationCount(notificationCount.unreadCount);
      setUnreadMessageCount(messageCount.unreadCount);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      // Navigate to first result
      window.location.href = `/profile/${searchResults[0].id}`;
    }
  };

  const handleUserClick = (userId: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowSearchResults(true);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await notificationsAPI.markAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        window.location.href = `/messages/${notification.sender._id}`;
        break;
      case 'follow':
        window.location.href = `/profile/${notification.sender._id}`;
        break;
      default:
        // For post, snap, mood notifications, go to sender's profile
        window.location.href = `/profile/${notification.sender._id}`;
    }
    
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <motion.header 
      className="bg-background-dark border-b border-border py-3 px-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile menu button */}
      <button 
        className="md:hidden text-text-primary hover:text-accent-pink"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Search bar */}
      <div className="hidden md:block flex-1 max-w-md relative" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-secondary" />
          </div>
          <input 
            type="text" 
            className="input pl-10"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
          />
        </form>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-background-card rounded-lg shadow-lg border border-border z-50 max-h-80 overflow-y-auto"
            >
              {isSearching ? (
                <div className="p-4 text-center text-text-secondary">
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  {searchQuery.trim() === '' ? 'Start typing to search users...' : 'No users found'}
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((searchUser) => (
                    <Link
                      key={searchUser.id}
                      to={`/profile/${searchUser.id}`}
                      className="flex items-center px-4 py-3 hover:bg-background-light transition-colors"
                      onClick={() => handleUserClick(searchUser.id)}
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                        {searchUser.profilePic ? (
                          <img 
                            src={searchUser.profilePic} 
                            alt={searchUser.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-text-secondary" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-text-primary">{searchUser.name}</p>
                        <p className="text-sm text-text-secondary">@{searchUser.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Messages */}
        <Link to="/messages" className="relative text-text-primary hover:text-accent-pink">
          <MessageSquare size={24} />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-pink text-white text-xs flex items-center justify-center">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            className="text-text-primary hover:text-accent-pink"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-pink text-white text-xs flex items-center justify-center">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-background-card rounded-lg shadow-lg border border-border z-50"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-medium">Notifications</h3>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-accent-pink hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-text-secondary">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="py-2">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification._id}
                          className={`px-4 py-3 hover:bg-background-light cursor-pointer transition-colors ${
                            !notification.read ? 'bg-accent-pink bg-opacity-5' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                              {notification.sender.profilePic ? (
                                <img 
                                  src={notification.sender.profilePic} 
                                  alt={notification.sender.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User size={16} className="text-text-secondary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary">
                                {notification.message}
                              </p>
                              <p className="text-xs text-text-secondary mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-accent-pink"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User profile */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
            {user?.profilePic ? (
              <img 
                src={user.profilePic} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={16} className="text-text-secondary" />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
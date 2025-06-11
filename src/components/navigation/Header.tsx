import { Search, Menu, Bell, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User as UserType } from '../../types';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, registeredUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = registeredUsers.filter(u => 
      u.id !== user?.id && (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    
    setSearchResults(filtered);
    setShowSearchResults(true);
  }, [searchQuery, registeredUsers, user]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
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
            onFocus={() => searchQuery && setShowSearchResults(true)}
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
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  No users found
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
        {/* Notifications */}
        <div className="relative">
          <button 
            className="text-text-primary hover:text-accent-pink"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent-pink"></span>
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-background-card rounded-lg shadow-lg py-2 z-10">
              <div className="px-4 py-2 border-b border-border">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-background-light">
                  <div className="flex items-start">
                    <img 
                      src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="User" 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <p className="text-sm">
                        <span className="font-medium">Jordan Lee</span> liked your post
                      </p>
                      <p className="text-xs text-text-secondary mt-1">2 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-background-light">
                  <div className="flex items-start">
                    <img 
                      src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="User" 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <p className="text-sm">
                        <span className="font-medium">Taylor Swift</span> commented on your post
                      </p>
                      <p className="text-xs text-text-secondary mt-1">15 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-background-light">
                  <div className="flex items-start">
                    <img 
                      src="https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600" 
                      alt="User" 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <p className="text-sm">
                        <span className="font-medium">Jamie Chen</span> started following you
                      </p>
                      <p className="text-xs text-text-secondary mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-border">
                <button className="text-sm text-accent-pink hover:underline">
                  See all notifications
                </button>
              </div>
            </div>
          )}
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
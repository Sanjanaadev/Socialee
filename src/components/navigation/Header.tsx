import { Search, Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Search for: ${searchQuery}`);
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
      <div className="hidden md:block flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-secondary" />
          </div>
          <input 
            type="text" 
            className="input pl-10"
            placeholder="Search Socialee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
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
          <img 
            src={user?.profilePic || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600'} 
            alt="Profile" 
            className="h-8 w-8 rounded-full object-cover"
          />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
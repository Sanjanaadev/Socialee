import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, MessageSquare, MessageCircle, User, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  onCloseSidebar?: () => void;
}

const Sidebar = ({ onCloseSidebar }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.div 
      className="h-full w-60 bg-background-dark border-r border-border flex flex-col"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="p-6">
        <Link to="/home" className="flex items-center gap-3" onClick={onCloseSidebar}>
          <MessageSquare className="h-6 w-6 text-accent-pink" />
          <span className="text-xl font-bold text-text-primary">Socialee</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        <Link 
          to="/home" 
          className={`sidebar-link ${isActive('/home') ? 'active' : ''}`}
          onClick={onCloseSidebar}
        >
          <Home size={20} />
          <span>Home</span>
        </Link>

        <Link 
          to="/snaps" 
          className={`sidebar-link ${isActive('/snaps') ? 'active' : ''}`}
          onClick={onCloseSidebar}
        >
          <Zap size={20} />
          <span>Snaps</span>
        </Link>

        <Link 
          to="/moods" 
          className={`sidebar-link ${isActive('/moods') ? 'active' : ''}`}
          onClick={onCloseSidebar}
        >
          <MessageCircle size={20} />
          <span>Moods</span>
        </Link>

        <Link 
          to="/messages" 
          className={`sidebar-link ${isActive('/messages') ? 'active' : ''}`}
          onClick={onCloseSidebar}
        >
          <MessageSquare size={20} />
          <span>Messages</span>
        </Link>

        <Link 
          to="/profile" 
          className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
          onClick={onCloseSidebar}
        >
          <User size={20} />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Create Button */}
      <div className="px-4 my-4">
        <Link 
          to="/create"
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={onCloseSidebar}
        >
          <Plus size={20} />
          <span>Create</span>
        </Link>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
            {user?.profilePic ? (
              <img 
                src={user.profilePic} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={20} className="text-text-secondary" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
            <p className="text-xs text-text-secondary">@{user?.username || 'username'}</p>
          </div>
        </div>

        <button 
          className="mt-4 text-text-secondary flex items-center gap-2 hover:text-accent-pink transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
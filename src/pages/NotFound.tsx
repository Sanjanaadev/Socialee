import { Link } from 'react-router-dom';
import { HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-6xl font-bold text-accent-pink mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-text-secondary mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/home" className="btn-primary flex items-center gap-2">
        <HomeIcon size={18} />
        <span>Back to Home</span>
      </Link>
    </motion.div>
  );
};

export default NotFound;
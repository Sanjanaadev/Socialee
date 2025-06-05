import { Outlet } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side with branding */}
      <motion.div 
        className="bg-background-dark w-full md:w-1/2 p-8 flex flex-col justify-center items-center"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md mx-auto text-center">
          <motion.div 
            className="flex items-center justify-center mb-4"
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <MessageSquare className="h-12 w-12 text-accent-pink" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Socialee</h1>
          <motion.p 
            className="text-text-secondary mb-8"
            animate={{ 
              opacity: [0, 1],
              y: [20, 0] 
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              repeatDelay: 4
            }}
          >
            Discover a place to connect, share, and grow your story with the world.
          </motion.p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div 
              className="bg-background-card p-4 rounded-lg cursor-pointer"
              whileHover={{ scale: 1.05, backgroundColor: '#2A2A2A' }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-medium text-accent-pink">Share</h3>
              <p className="text-text-secondary text-sm mt-2">Moments</p>
            </motion.div>
            <motion.div 
              className="bg-background-card p-4 rounded-lg cursor-pointer"
              whileHover={{ scale: 1.05, backgroundColor: '#2A2A2A' }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-medium text-accent-purple">Connect</h3>
              <p className="text-text-secondary text-sm mt-2">With friends</p>
            </motion.div>
            <motion.div 
              className="bg-background-card p-4 rounded-lg cursor-pointer"
              whileHover={{ scale: 1.05, backgroundColor: '#2A2A2A' }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="font-medium text-accent-blue">Express</h3>
              <p className="text-text-secondary text-sm mt-2">Your thoughts</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Right side with auth forms */}
      <motion.div 
        className="bg-gradient-to-br from-background-light via-background-card to-background-dark w-full md:w-1/2 p-8 flex items-center justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
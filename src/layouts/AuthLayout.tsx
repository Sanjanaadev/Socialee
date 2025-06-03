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
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-accent-pink" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Socialee</h1>
          <p className="text-text-secondary mb-8">
            Connect with friends and the world around you with Socialee's sleek and stylish platform.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-background-card p-4 rounded-lg">
              <h3 className="font-medium text-accent-pink">Share</h3>
              <p className="text-text-secondary text-sm mt-2">Photos and moments</p>
            </div>
            <div className="bg-background-card p-4 rounded-lg">
              <h3 className="font-medium text-accent-purple">Connect</h3>
              <p className="text-text-secondary text-sm mt-2">With friends</p>
            </div>
            <div className="bg-background-card p-4 rounded-lg">
              <h3 className="font-medium text-accent-blue">Express</h3>
              <p className="text-text-secondary text-sm mt-2">Your thoughts</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Right side with auth forms */}
      <motion.div 
        className="bg-background-light w-full md:w-1/2 p-8 flex items-center justify-center"
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
import { useState, useEffect } from 'react';
import { snaps } from '../data/mockData';
import { Snap } from '../types';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Snaps = () => {
  const [userSnaps, setUserSnaps] = useState<Snap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSnap, setActiveSnap] = useState<Snap | null>(null);
  const [showSnapModal, setShowSnapModal] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setUserSnaps(snaps);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewSnap = (snap: Snap) => {
    setActiveSnap(snap);
    setShowSnapModal(true);
  };

  const handleCloseSnap = () => {
    setActiveSnap(null);
    setShowSnapModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading snaps...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Snaps</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Add new snap button */}
        <motion.div
          className="aspect-square rounded-lg bg-background-light flex flex-col items-center justify-center cursor-pointer hover:bg-background-card transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => alert('Create new snap functionality would open here')}
        >
          <div className="h-12 w-12 rounded-full bg-accent-pink flex items-center justify-center mb-2">
            <Plus size={24} className="text-white" />
          </div>
          <p className="text-sm text-text-secondary">Add Snap</p>
        </motion.div>
        
        {/* User snaps */}
        {userSnaps.map((snap, index) => (
          <motion.div
            key={snap.id}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => handleViewSnap(snap)}
          >
            <div className="relative h-full w-full">
              <img 
                src={snap.mediaUrl} 
                alt="Snap" 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex items-center">
                  <img 
                    src={snap.author.profilePic} 
                    alt={snap.author.name} 
                    className="h-6 w-6 rounded-full object-cover border border-white"
                  />
                  <span className="ml-1 text-xs text-white truncate">{snap.author.name}</span>
                </div>
              </div>
              <div className="absolute inset-0 ring-2 ring-accent-pink ring-offset-0 rounded-lg"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Snap Viewer Modal */}
      {showSnapModal && activeSnap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90" onClick={handleCloseSnap}>
          <motion.div 
            className="max-w-lg w-full h-[70vh] relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeSnap.mediaUrl} 
              alt="Snap" 
              className="h-full w-full object-contain rounded-lg"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center">
                <img 
                  src={activeSnap.author.profilePic} 
                  alt={activeSnap.author.name} 
                  className="h-8 w-8 rounded-full object-cover border border-white"
                />
                <div className="ml-2">
                  <p className="text-white font-medium">{activeSnap.author.name}</p>
                  <p className="text-xs text-gray-300">{activeSnap.createdAt}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Snaps;
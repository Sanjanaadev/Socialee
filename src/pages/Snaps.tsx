import { useState, useEffect } from 'react';
import { snaps } from '../data/mockData';
import { Snap } from '../types';
import { Plus, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Snaps = () => {
  const [userSnaps, setUserSnaps] = useState<Snap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSnap, setActiveSnap] = useState<Snap | null>(null);
  const [showSnapModal, setShowSnapModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { followingUsers, registeredUsers, user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Filter snaps to show only from followed users and registered users
      const followedUserIds = followingUsers.map(u => u.id);
      const registeredUserIds = registeredUsers.map(u => u.id);
      
      const personalizedSnaps = snaps.filter(snap => {
        const isCurrentUser = snap.author.id === user?.id;
        const isFollowedUser = followedUserIds.includes(snap.author.id);
        const isRegisteredUser = registeredUserIds.includes(snap.author.id);
        
        return isCurrentUser || (isFollowedUser && isRegisteredUser);
      });

      // If no personalized snaps, show sample snaps from registered users
      const finalSnaps = personalizedSnaps.length > 0 
        ? personalizedSnaps 
        : snaps.filter(snap => registeredUserIds.includes(snap.author.id)).slice(0, 4);

      setUserSnaps(finalSnaps);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [followingUsers, registeredUsers, user]);

  const handleViewSnap = (snap: Snap) => {
    setActiveSnap(snap);
    setShowSnapModal(true);
  };

  const handleCloseSnap = () => {
    setActiveSnap(null);
    setShowSnapModal(false);
  };

  const handleCreateSnap = () => {
    setShowCreateModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File must be less than 10MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select a valid image or video file');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSnapSubmit = async () => {
    if (!selectedFile || !user) return;
    
    setIsCreating(true);
    
    try {
      // Create new snap
      const newSnap: Snap = {
        id: `snap-${Date.now()}`,
        mediaUrl: previewUrl!,
        author: user,
        createdAt: 'just now',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      // Add to snaps list
      setUserSnaps(prev => [newSnap, ...prev]);
      
      // Close modal and reset state
      setShowCreateModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast.success('Snap created successfully!');
    } catch (error) {
      toast.error('Failed to create snap');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Snaps</h1>
        <p className="text-text-secondary text-sm">
          Stories from people you follow
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Add new snap button */}
        <motion.div
          className="aspect-square rounded-lg bg-background-light flex flex-col items-center justify-center cursor-pointer hover:bg-background-card transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateSnap}
        >
          <div className="h-12 w-12 rounded-full bg-accent-pink flex items-center justify-center mb-2">
            <Plus size={24} className="text-white" />
          </div>
          <p className="text-sm text-text-secondary">Add Snap</p>
        </motion.div>
        
        {/* User snaps */}
        {userSnaps.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <h2 className="text-xl font-bold mb-4">No Snaps Yet</h2>
            <p className="text-text-secondary mb-6">
              Follow other users to see their snaps here, or create your first snap!
            </p>
          </div>
        ) : (
          userSnaps.map((snap, index) => (
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
                    <span className="ml-1 text-xs text-white truncate">
                      {snap.author.id === user?.id ? 'You' : snap.author.name}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 ring-2 ring-accent-pink ring-offset-0 rounded-lg"></div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Snap Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create New Snap</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              {!selectedFile ? (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-pink transition-colors">
                    <Camera size={48} className="text-text-secondary mb-4" />
                    <span className="text-text-secondary">Click to select image or video</span>
                    <span className="text-xs text-text-muted mt-2">Max 10MB</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    {selectedFile.type.startsWith('image/') ? (
                      <img
                        src={previewUrl!}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={previewUrl!}
                        className="w-full h-64 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-background-dark rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleCloseCreateModal}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSnapSubmit}
                      className="btn-primary"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Share Snap'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snap Viewer Modal */}
      <AnimatePresence>
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
                    <p className="text-white font-medium">
                      {activeSnap.author.id === user?.id ? 'Your Snap' : activeSnap.author.name}
                    </p>
                    <p className="text-xs text-gray-300">{activeSnap.createdAt}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Snaps;
import { useState, useEffect } from 'react';
import { Plus, Camera, X, Heart, Smile, Laugh, Frown, ThumbsUp, Eye, ChevronLeft, ChevronRight, User, Trash2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { snapsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Snap {
  _id: string;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  reactions?: Array<{
    user: string;
    type: string;
    createdAt: string;
  }>;
}

interface GroupedSnaps {
  author: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  snaps: Snap[];
  hasUnviewed: boolean;
}

const Snaps = () => {
  const [userSnaps, setUserSnaps] = useState<Snap[]>([]);
  const [groupedSnaps, setGroupedSnaps] = useState<GroupedSnaps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [activeSnapIndex, setActiveSnapIndex] = useState<number>(0);
  const [showSnapModal, setShowSnapModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [snapToDelete, setSnapToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const reactionTypes = [
    { type: 'like', icon: Heart, color: '#FF2E93' },
    { type: 'love', icon: Heart, color: '#E91E63' },
    { type: 'laugh', icon: Laugh, color: '#FFC107' },
    { type: 'wow', icon: Smile, color: '#2196F3' },
    { type: 'sad', icon: Frown, color: '#607D8B' },
    { type: 'angry', icon: ThumbsUp, color: '#F44336' },
  ];

  useEffect(() => {
    loadSnaps();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showSnapModal) return;
      
      if (e.key === 'ArrowLeft') {
        handlePreviousSnap();
      } else if (e.key === 'ArrowRight') {
        handleNextSnap();
      } else if (e.key === 'Escape') {
        handleCloseSnap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSnapModal, activeGroupIndex, activeSnapIndex, groupedSnaps.length]);

  const loadSnaps = async () => {
    try {
      const snaps = await snapsAPI.getFeedSnaps();
      setUserSnaps(snaps);
      
      // Group snaps by author
      const grouped = groupSnapsByAuthor(snaps);
      setGroupedSnaps(grouped);
    } catch (error) {
      console.error('Error loading snaps:', error);
      toast.error('Failed to load snaps');
    } finally {
      setIsLoading(false);
    }
  };

  const groupSnapsByAuthor = (snaps: Snap[]): GroupedSnaps[] => {
    const groups: { [key: string]: GroupedSnaps } = {};
    
    snaps.forEach(snap => {
      const authorId = snap.author._id;
      if (!groups[authorId]) {
        groups[authorId] = {
          author: snap.author,
          snaps: [],
          hasUnviewed: false
        };
      }
      groups[authorId].snaps.push(snap);
      // For now, we'll assume all snaps are unviewed - in a real app, you'd track this
      groups[authorId].hasUnviewed = true;
    });

    return Object.values(groups).sort((a, b) => 
      new Date(b.snaps[0].createdAt).getTime() - new Date(a.snaps[0].createdAt).getTime()
    );
  };

  const handleViewSnapGroup = async (groupIndex: number) => {
    setActiveGroupIndex(groupIndex);
    setActiveSnapIndex(0);
    setShowSnapModal(true);

    // Mark first snap as viewed
    const firstSnap = groupedSnaps[groupIndex].snaps[0];
    try {
      await snapsAPI.viewSnap(firstSnap._id);
    } catch (error) {
      console.error('Error marking snap as viewed:', error);
    }
  };

  const handleCloseSnap = () => {
    setShowSnapModal(false);
    setShowReactions(false);
    setActiveGroupIndex(0);
    setActiveSnapIndex(0);
  };

  const handleNextSnap = () => {
    const currentGroup = groupedSnaps[activeGroupIndex];
    if (activeSnapIndex < currentGroup.snaps.length - 1) {
      const nextSnapIndex = activeSnapIndex + 1;
      setActiveSnapIndex(nextSnapIndex);
      // Mark next snap as viewed
      try {
        snapsAPI.viewSnap(currentGroup.snaps[nextSnapIndex]._id);
      } catch (error) {
        console.error('Error marking snap as viewed:', error);
      }
    } else if (activeGroupIndex < groupedSnaps.length - 1) {
      // Move to next group
      const nextGroupIndex = activeGroupIndex + 1;
      setActiveGroupIndex(nextGroupIndex);
      setActiveSnapIndex(0);
      try {
        snapsAPI.viewSnap(groupedSnaps[nextGroupIndex].snaps[0]._id);
      } catch (error) {
        console.error('Error marking snap as viewed:', error);
      }
    }
  };

  const handlePreviousSnap = () => {
    if (activeSnapIndex > 0) {
      setActiveSnapIndex(activeSnapIndex - 1);
    } else if (activeGroupIndex > 0) {
      // Move to previous group, last snap
      const prevGroupIndex = activeGroupIndex - 1;
      const prevGroup = groupedSnaps[prevGroupIndex];
      setActiveGroupIndex(prevGroupIndex);
      setActiveSnapIndex(prevGroup.snaps.length - 1);
    }
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
      const snapData = {
        mediaUrl: previewUrl!,
        caption: caption.trim(),
        mediaType: selectedFile.type.startsWith('image/') ? 'image' : 'video'
      };

      const newSnap = await snapsAPI.createSnap(snapData);
      setUserSnaps(prev => [newSnap, ...prev]);
      
      // Reload grouped snaps
      const updatedSnaps = [newSnap, ...userSnaps];
      const grouped = groupSnapsByAuthor(updatedSnaps);
      setGroupedSnaps(grouped);
      
      // Close modal and reset state
      setShowCreateModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      
      toast.success('Snap created successfully!');
    } catch (error: any) {
      console.error('Error creating snap:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create snap';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
  };

  const handleDeleteSnap = async (snapId: string) => {
    setSnapToDelete(snapId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSnap = async () => {
    if (!snapToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await snapsAPI.deleteSnap(snapToDelete);
      
      // Remove snap from userSnaps
      setUserSnaps(prev => prev.filter(snap => snap._id !== snapToDelete));
      
      // Update grouped snaps
      const updatedSnaps = userSnaps.filter(snap => snap._id !== snapToDelete);
      const grouped = groupSnapsByAuthor(updatedSnaps);
      setGroupedSnaps(grouped);
      
      // Close modal if we're viewing the deleted snap
      const activeGroup = groupedSnaps[activeGroupIndex];
      const activeSnap = activeGroup?.snaps[activeSnapIndex];
      if (activeSnap?._id === snapToDelete) {
        setShowSnapModal(false);
      }
      
      toast.success('Snap deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting snap:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete snap';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSnapToDelete(null);
    }
  };

  const handleReaction = async (reactionType: string) => {
    const activeGroup = groupedSnaps[activeGroupIndex];
    const activeSnap = activeGroup.snaps[activeSnapIndex];
    if (!activeSnap || !user) return;

    try {
      const updatedSnap = await snapsAPI.reactToSnap(activeSnap._id, reactionType);
      
      // Update the snap in both arrays
      setUserSnaps(prev => 
        prev.map(snap => snap._id === activeSnap._id ? updatedSnap : snap)
      );
      
      setGroupedSnaps(prev => 
        prev.map((group, groupIdx) => 
          groupIdx === activeGroupIndex 
            ? {
                ...group,
                snaps: group.snaps.map((snap, snapIdx) => 
                  snapIdx === activeSnapIndex ? updatedSnap : snap
                )
              }
            : group
        )
      );
      
      setShowReactions(false);
      toast.success(`Reacted with ${reactionType}!`);
    } catch (error: any) {
      console.error('Error reacting to snap:', error);
      toast.error('Failed to react to snap');
    }
  };

  const getUserReaction = (snap: Snap) => {
    if (!snap.reactions || !user) return null;
    return snap.reactions.find(r => r.user === user.id);
  };

  const getReactionCounts = (snap: Snap) => {
    if (!snap.reactions) return {};
    const counts: { [key: string]: number } = {};
    snap.reactions.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    });
    return counts;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading snaps...</div>
      </div>
    );
  }

  const activeGroup = groupedSnaps[activeGroupIndex];
  const activeSnap = activeGroup?.snaps[activeSnapIndex];

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
        
        {/* Grouped snaps */}
        {groupedSnaps.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <h2 className="text-xl font-bold mb-4">No Snaps Yet</h2>
            <p className="text-text-secondary mb-6">
              Follow other users to see their snaps here, or create your first snap!
            </p>
          </div>
        ) : (
          groupedSnaps.map((group, groupIndex) => (
            <motion.div
              key={group.author._id}
              className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
              onClick={() => handleViewSnapGroup(groupIndex)}
            >
              <div className="relative h-full w-full">
                {/* Show the latest snap as preview */}
                {group.snaps[0].mediaType === 'video' ? (
                  <video 
                    src={group.snaps[0].mediaUrl} 
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <img 
                    src={group.snaps[0].mediaUrl} 
                    alt="Snap" 
                    className="h-full w-full object-cover"
                  />
                )}
                
                {/* Delete button for own snaps */}
                {group.author._id === user?.id && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnap(group.snaps[0]._id);
                      }}
                      className="p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                )}
                
                {/* Snap count indicator */}
                {group.snaps.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    {group.snaps.length}
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full overflow-hidden bg-background-light flex items-center justify-center border border-white">
                        {group.author.profilePic ? (
                          <img 
                            src={group.author.profilePic} 
                            alt={group.author.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={12} className="text-text-secondary" />
                        )}
                      </div>
                      <span className="ml-1 text-xs text-white truncate">
                        {group.author._id === user?.id ? 'You' : group.author.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye size={12} className="text-white" />
                      <span className="text-xs text-white">{group.snaps[0].viewsCount}</span>
                    </div>
                  </div>
                </div>
                
                {/* Ring indicator for unviewed snaps */}
                <div className={`absolute inset-0 rounded-lg ${
                  group.hasUnviewed 
                    ? 'ring-2 ring-accent-pink ring-offset-0' 
                    : 'ring-2 ring-gray-500 ring-offset-0'
                }`}></div>
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

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Caption (optional)
                    </label>
                    <textarea
                      className="input h-20 resize-none"
                      placeholder="Add a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={200}
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {caption.length}/200 characters
                    </p>
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

      {/* Delete Confirmation Modal - Higher z-index */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Delete Snap</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to delete this snap? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-outline"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSnap}
                  className="btn bg-error hover:bg-opacity-90 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Snap'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snap Viewer Modal */}
      <AnimatePresence>
        {showSnapModal && activeSnap && activeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90" onClick={handleCloseSnap}>
            <motion.div 
              className="max-w-lg w-full h-[70vh] relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Arrows */}
              {(activeSnapIndex > 0 || activeGroupIndex > 0) && (
                <button
                  onClick={handlePreviousSnap}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
              )}
              
              {(activeSnapIndex < activeGroup.snaps.length - 1 || activeGroupIndex < groupedSnaps.length - 1) && (
                <button
                  onClick={handleNextSnap}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              )}

              {/* Progress Indicators for current group */}
              {activeGroup.snaps.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
                  {activeGroup.snaps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 w-8 rounded-full transition-all ${
                        index === activeSnapIndex ? 'bg-white' : 'bg-white bg-opacity-30'
                      }`}
                    />
                  ))}
                </div>
              )}

              {activeSnap.mediaType === 'video' ? (
                <video 
                  src={activeSnap.mediaUrl} 
                  className="h-full w-full object-contain rounded-lg"
                  controls
                  autoPlay
                />
              ) : (
                <img 
                  src={activeSnap.mediaUrl} 
                  alt="Snap" 
                  className="h-full w-full object-contain rounded-lg"
                />
              )}
              
              {/* Snap Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-background-light flex items-center justify-center border border-white">
                      {activeSnap.author.profilePic ? (
                        <img 
                          src={activeSnap.author.profilePic} 
                          alt={activeSnap.author.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-text-secondary" />
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="text-white font-medium">
                        {activeSnap.author._id === user?.id ? 'Your Snap' : activeSnap.author.name}
                      </p>
                      <p className="text-xs text-gray-300">
                        {formatDistanceToNow(new Date(activeSnap.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Eye size={16} className="text-white" />
                      <span className="text-sm text-white">{activeSnap.viewsCount}</span>
                    </div>
                    {activeSnap.author._id === user?.id ? (
                      <button
                        onClick={() => handleDeleteSnap(activeSnap._id)}
                        className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowReactions(!showReactions)}
                        className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                      >
                        <Heart size={16} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
                
                {activeSnap.caption && (
                  <p className="text-white mb-3">{activeSnap.caption}</p>
                )}

                {/* Reaction Counts */}
                {activeSnap.reactions && activeSnap.reactions.length > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    {Object.entries(getReactionCounts(activeSnap)).map(([type, count]) => {
                      const reactionConfig = reactionTypes.find(r => r.type === type);
                      if (!reactionConfig) return null;
                      const Icon = reactionConfig.icon;
                      return (
                        <div key={type} className="flex items-center space-x-1 bg-white bg-opacity-20 rounded-full px-2 py-1">
                          <Icon size={12} style={{ color: reactionConfig.color }} />
                          <span className="text-xs text-white">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reactions Panel */}
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center justify-center space-x-3 bg-white bg-opacity-20 rounded-full p-3"
                    >
                      {reactionTypes.map((reaction) => {
                        const Icon = reaction.icon;
                        const userReaction = getUserReaction(activeSnap);
                        const isSelected = userReaction?.type === reaction.type;
                        
                        return (
                          <button
                            key={reaction.type}
                            onClick={() => handleReaction(reaction.type)}
                            className={`p-2 rounded-full transition-all ${
                              isSelected 
                                ? 'bg-white bg-opacity-40 scale-110' 
                                : 'hover:bg-white hover:bg-opacity-30 hover:scale-105'
                            }`}
                          >
                            <Icon 
                              size={20} 
                              style={{ color: reaction.color }}
                              fill={isSelected ? reaction.color : 'none'}
                            />
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseSnap}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Snaps;
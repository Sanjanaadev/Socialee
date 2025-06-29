import { useState, useEffect } from 'react';
import { Heart, Send, Trash2, MessageCircle, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { moodsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface MoodComment {
  _id: string;
  text: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  createdAt: string;
}

interface Mood {
  _id: string;
  text: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  likes: string[];
  likesCount: number;
  mood: string;
  backgroundColor: string;
  textColor: string;
  createdAt: string;
  comments?: MoodComment[];
  commentsCount?: number;
}

const Moods = () => {
  const [userMoods, setUserMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMood, setNewMood] = useState('');
  const [selectedMoodType, setSelectedMoodType] = useState('neutral');
  const [selectedBgColor, setSelectedBgColor] = useState('#FF2E93');
  const [isCreating, setIsCreating] = useState(false);
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [isCommenting, setIsCommenting] = useState<{ [key: string]: boolean }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moodToDelete, setMoodToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const moodTypes = [
    { value: 'happy', label: '😊 Happy', emoji: '😊', color: '#4CAF50' },
    { value: 'sad', label: '😢 Sad', emoji: '😢', color: '#2196F3' },
    { value: 'excited', label: '🎉 Excited', emoji: '🎉', color: '#FF9800' },
    { value: 'angry', label: '😠 Angry', emoji: '😠', color: '#F44336' },
    { value: 'love', label: '❤️ Love', emoji: '❤️', color: '#E91E63' },
    { value: 'surprised', label: '😲 Surprised', emoji: '😲', color: '#9C27B0' },
    { value: 'neutral', label: '😐 Neutral', emoji: '😐', color: '#FF2E93' },
  ];

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      const moods = await moodsAPI.getFeedMoods();
      console.log('Loaded moods:', moods);
      
      // Ensure all moods have proper array initialization
      const processedMoods = moods.map((mood: any) => ({
        ...mood,
        likes: Array.isArray(mood.likes) ? mood.likes : [],
        comments: Array.isArray(mood.comments) ? mood.comments : [],
        likesCount: Array.isArray(mood.likes) ? mood.likes.length : 0,
        commentsCount: Array.isArray(mood.comments) ? mood.comments.length : 0
      }));
      
      setUserMoods(processedMoods);
    } catch (error) {
      console.error('Error loading moods:', error);
      toast.error('Failed to load moods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMood.trim() === '' || !user) return;
    
    setIsCreating(true);

    try {
      const moodData = {
        text: newMood.trim(),
        mood: selectedMoodType,
        backgroundColor: selectedBgColor,
        textColor: '#FFFFFF'
      };

      const newMoodPost = await moodsAPI.createMood(moodData);
      
      // Ensure the new mood has proper array initialization
      const processedMood = {
        ...newMoodPost,
        likes: Array.isArray(newMoodPost.likes) ? newMoodPost.likes : [],
        comments: Array.isArray(newMoodPost.comments) ? newMoodPost.comments : [],
        likesCount: Array.isArray(newMoodPost.likes) ? newMoodPost.likes.length : 0,
        commentsCount: Array.isArray(newMoodPost.comments) ? newMoodPost.comments.length : 0
      };
      
      setUserMoods(prev => [processedMood, ...prev]);
      setNewMood('');
      setSelectedMoodType('neutral');
      setSelectedBgColor('#FF2E93');
      toast.success('Mood posted successfully!');
    } catch (error: any) {
      console.error('Error creating mood:', error);
      const errorMessage = error.response?.data?.error || 'Failed to post mood';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (moodId: string) => {
    try {
      const result = await moodsAPI.likeMood(moodId);
      setUserMoods(prevMoods => 
        prevMoods.map(mood => 
          mood._id === moodId 
            ? { 
                ...mood, 
                likes: Array.isArray(result.mood.likes) ? result.mood.likes : [],
                likesCount: result.likes || 0
              }
            : mood
        )
      );
    } catch (error) {
      console.error('Error liking mood:', error);
      toast.error('Failed to like mood');
    }
  };

  const handleComment = async (moodId: string) => {
    if (!newComments[moodId]?.trim() || !user) return;

    setIsCommenting(prev => ({ ...prev, [moodId]: true }));

    try {
      const comment = await moodsAPI.addComment(moodId, newComments[moodId].trim());
      console.log('Comment added:', comment);
      
      setUserMoods(prevMoods =>
        prevMoods.map(mood =>
          mood._id === moodId
            ? { 
                ...mood, 
                comments: [...(Array.isArray(mood.comments) ? mood.comments : []), comment],
                commentsCount: (mood.commentsCount || 0) + 1
              }
            : mood
        )
      );

      setNewComments(prev => ({ ...prev, [moodId]: '' }));
      toast.success('Comment added!');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setIsCommenting(prev => ({ ...prev, [moodId]: false }));
    }
  };

  const handleDeleteMood = async (moodId: string) => {
    setMoodToDelete(moodId);
    setShowDeleteModal(true);
  };

  const confirmDeleteMood = async () => {
    if (!moodToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await moodsAPI.deleteMood(moodToDelete);
      setUserMoods(prev => prev.filter(mood => mood._id !== moodToDelete));
      toast.success('Mood deleted successfully');
    } catch (error: any) {
      console.error('Error deleting mood:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete mood';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMoodToDelete(null);
    }
  };

  const getMoodEmoji = (moodType: string) => {
    const mood = moodTypes.find(m => m.value === moodType);
    return mood ? mood.emoji : '😐';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading moods...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Moods</h1>
        <p className="text-text-secondary text-sm">
          Express your thoughts
        </p>
      </div>
      
      {/* New mood form */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="input h-24 resize-none"
            placeholder="How are you feeling today?"
            value={newMood}
            onChange={(e) => setNewMood(e.target.value)}
            maxLength={280}
          ></textarea>
          
          {/* Mood type selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Mood Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {moodTypes.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    selectedMoodType === mood.value
                      ? 'bg-accent-pink text-white'
                      : 'bg-background-light hover:bg-background-card'
                  }`}
                  onClick={() => {
                    setSelectedMoodType(mood.value);
                    setSelectedBgColor(mood.color);
                  }}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              {newMood.length}/280 characters
            </span>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2"
              disabled={newMood.trim() === '' || isCreating}
            >
              <Send size={16} />
              <span>{isCreating ? 'Posting...' : 'Post Mood'}</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Moods list */}
      {userMoods.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-bold mb-4">No Moods Yet</h2>
          <p className="text-text-secondary mb-6">
            Follow other users to see their moods here, or share your first mood above!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {userMoods.map((mood, index) => (
            <motion.div
              key={mood._id}
              className="card p-4"
              style={{ backgroundColor: mood.backgroundColor }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                    {mood.author.profilePic ? (
                      <img 
                        src={mood.author.profilePic} 
                        alt={mood.author.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-text-primary" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium" style={{ color: mood.textColor }}>
                      {mood.author._id === user?.id ? 'You' : mood.author.name}
                    </div>
                    <div className="text-xs opacity-75" style={{ color: mood.textColor }}>
                      {formatDistanceToNow(new Date(mood.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {mood.author._id === user?.id && (
                  <button
                    onClick={() => handleDeleteMood(mood._id)}
                    className="p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
                    style={{ color: mood.textColor }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {/* Mood text with emoji */}
              <div className="mb-3 flex items-start gap-2">
                <span className="text-2xl">{getMoodEmoji(mood.mood)}</span>
                <p style={{ color: mood.textColor }} className="flex-1">{mood.text}</p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-4 mb-3">
                <button 
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: mood.textColor }}
                  onClick={() => handleLike(mood._id)}
                >
                  <Heart 
                    size={18} 
                    fill={Array.isArray(mood.likes) && mood.likes.includes(user?.id || '') ? 'currentColor' : 'none'}
                  />
                  <span className="text-sm">{mood.likesCount || 0}</span>
                </button>
                
                <div className="flex items-center gap-1" style={{ color: mood.textColor }}>
                  <MessageCircle size={18} />
                  <span className="text-sm">{mood.commentsCount || 0}</span>
                </div>
              </div>

              {/* Comments */}
              {mood.comments && mood.comments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {mood.comments.map(comment => (
                    <div key={comment._id} className="flex items-start space-x-2">
                      <div className="h-6 w-6 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                        {comment.author.profilePic ? (
                          <img 
                            src={comment.author.profilePic} 
                            alt={comment.author.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={12} className="text-text-primary" />
                        )}
                      </div>
                      <div className="flex-1 bg-black bg-opacity-20 rounded-lg p-2">
                        <p className="text-sm" style={{ color: mood.textColor }}>
                          <span className="font-medium">{comment.author.name}</span>{' '}
                          {comment.text}
                        </p>
                        <p className="text-xs opacity-75 mt-1" style={{ color: mood.textColor }}>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 bg-black bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  placeholder="Add a comment..."
                  value={newComments[mood._id] || ''}
                  onChange={(e) => setNewComments(prev => ({ ...prev, [mood._id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && !isCommenting[mood._id] && handleComment(mood._id)}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: mood.textColor,
                    borderColor: `${mood.textColor}50`
                  }}
                  disabled={isCommenting[mood._id]}
                />
                <button
                  className="p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors disabled:opacity-50"
                  style={{ color: mood.textColor }}
                  onClick={() => handleComment(mood._id)}
                  disabled={isCommenting[mood._id] || !newComments[mood._id]?.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Delete Mood</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to delete this mood? This action cannot be undone.
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
                  onClick={confirmDeleteMood}
                  className="btn bg-error hover:bg-opacity-90 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Mood'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Moods;
import { useState, useEffect } from 'react';
import { Heart, Send, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

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
}

const Moods = () => {
  const [userMoods, setUserMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMood, setNewMood] = useState('');
  const [selectedMoodType, setSelectedMoodType] = useState('neutral');
  const [selectedBgColor, setSelectedBgColor] = useState('#FF2E93');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const moodTypes = [
    { value: 'happy', label: '😊 Happy', color: '#4CAF50' },
    { value: 'sad', label: '😢 Sad', color: '#2196F3' },
    { value: 'excited', label: '🎉 Excited', color: '#FF9800' },
    { value: 'angry', label: '😠 Angry', color: '#F44336' },
    { value: 'love', label: '❤️ Love', color: '#E91E63' },
    { value: 'surprised', label: '😲 Surprised', color: '#9C27B0' },
    { value: 'neutral', label: '😐 Neutral', color: '#FF2E93' },
  ];

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      const token = localStorage.getItem('socialee_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/moods/feed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const moods = await response.json();
        setUserMoods(moods);
      } else {
        console.error('Failed to load moods');
      }
    } catch (error) {
      console.error('Error loading moods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMood.trim() === '' || !user) return;
    
    setIsCreating(true);

    try {
      const token = localStorage.getItem('socialee_token');
      if (!token) {
        toast.error('Please log in to post a mood');
        return;
      }

      const moodData = {
        text: newMood.trim(),
        mood: selectedMoodType,
        backgroundColor: selectedBgColor,
        textColor: '#FFFFFF'
      };

      const response = await fetch('http://localhost:5000/api/moods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });

      if (response.ok) {
        const newMoodPost = await response.json();
        setUserMoods(prev => [newMoodPost, ...prev]);
        setNewMood('');
        setSelectedMoodType('neutral');
        setSelectedBgColor('#FF2E93');
        toast.success('Mood posted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to post mood');
      }
    } catch (error) {
      console.error('Error creating mood:', error);
      toast.error('Failed to post mood');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (moodId: string) => {
    try {
      const token = localStorage.getItem('socialee_token');
      if (!token) {
        toast.error('Please log in to like moods');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/moods/${moodId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUserMoods(prevMoods => 
          prevMoods.map(mood => 
            mood._id === moodId 
              ? { ...mood, likes: result.mood.likes, likesCount: result.likes }
              : mood
          )
        );
      } else {
        toast.error('Failed to like mood');
      }
    } catch (error) {
      console.error('Error liking mood:', error);
      toast.error('Failed to like mood');
    }
  };

  const handleDeleteMood = async (moodId: string) => {
    if (!confirm('Are you sure you want to delete this mood?')) return;

    try {
      const token = localStorage.getItem('socialee_token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/moods/${moodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUserMoods(prev => prev.filter(mood => mood._id !== moodId));
        toast.success('Mood deleted successfully');
      } else {
        toast.error('Failed to delete mood');
      }
    } catch (error) {
      console.error('Error deleting mood:', error);
      toast.error('Failed to delete mood');
    }
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
                      <span className="font-medium text-text-primary">
                        {mood.author.name.charAt(0).toUpperCase()}
                      </span>
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
              <p className="mb-3" style={{ color: mood.textColor }}>{mood.text}</p>
              <div className="flex items-center">
                <button 
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: mood.textColor }}
                  onClick={() => handleLike(mood._id)}
                >
                  <Heart 
                    size={18} 
                    fill={mood.likes.includes(user?.id || '') ? 'currentColor' : 'none'}
                  />
                  <span className="text-sm">{mood.likesCount || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Moods;
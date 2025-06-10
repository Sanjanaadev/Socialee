import { useState, useEffect } from 'react';
import { moods } from '../data/mockData';
import { Mood } from '../types';
import { Heart, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Moods = () => {
  const [userMoods, setUserMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMood, setNewMood] = useState('');
  const { followingUsers, registeredUsers, user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Filter moods to show only from followed users and registered users
      const followedUserIds = followingUsers.map(u => u.id);
      const registeredUserIds = registeredUsers.map(u => u.id);
      
      const personalizedMoods = moods.filter(mood => {
        const isCurrentUser = mood.author.id === user?.id;
        const isFollowedUser = followedUserIds.includes(mood.author.id);
        const isRegisteredUser = registeredUserIds.includes(mood.author.id);
        
        return isCurrentUser || (isFollowedUser && isRegisteredUser);
      });

      // If no personalized moods, show sample moods from registered users
      const finalMoods = personalizedMoods.length > 0 
        ? personalizedMoods 
        : moods.filter(mood => registeredUserIds.includes(mood.author.id)).slice(0, 3);

      setUserMoods(finalMoods);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [followingUsers, registeredUsers, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMood.trim() === '' || !user) return;
    
    // Create new mood
    const newMoodPost: Mood = {
      id: `mood-${Date.now()}`,
      text: newMood.trim(),
      author: user,
      likes: 0,
      createdAt: 'just now'
    };

    // Add to moods list
    setUserMoods(prev => [newMoodPost, ...prev]);
    setNewMood('');
  };

  const handleLike = (moodId: string) => {
    setUserMoods(prevMoods => 
      prevMoods.map(mood => 
        mood.id === moodId ? { ...mood, likes: mood.likes + 1 } : mood
      )
    );
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
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              {newMood.length}/280 characters
            </span>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2"
              disabled={newMood.trim() === ''}
            >
              <Send size={16} />
              <span>Post Mood</span>
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
              key={mood.id}
              className="card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-3">
                <img 
                  src={mood.author.profilePic} 
                  alt={mood.author.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <div className="font-medium">
                    {mood.author.id === user?.id ? 'You' : mood.author.name}
                  </div>
                  <div className="text-xs text-text-muted">{mood.createdAt}</div>
                </div>
              </div>
              <p className="text-text-primary mb-3">{mood.text}</p>
              <div className="flex items-center text-text-muted">
                <button 
                  className="flex items-center gap-1 hover:text-accent-pink transition-colors"
                  onClick={() => handleLike(mood.id)}
                >
                  <Heart size={18} />
                  <span className="text-sm">{mood.likes}</span>
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
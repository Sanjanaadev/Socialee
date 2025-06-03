import { useState, useEffect } from 'react';
import { moods } from '../data/mockData';
import { Mood } from '../types';
import { Heart, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Moods = () => {
  const [userMoods, setUserMoods] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMood, setNewMood] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setUserMoods(moods);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMood.trim() === '') return;
    
    // In a real app, this would call an API to save the mood
    alert(`New mood posted: ${newMood}`);
    setNewMood('');
  };

  const handleLike = (moodId: string) => {
    // In a real app, this would call an API to like the mood
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
      <h1 className="text-2xl font-bold mb-6">Moods</h1>
      
      {/* New mood form */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="input h-24 resize-none"
            placeholder="How are you feeling today?"
            value={newMood}
            onChange={(e) => setNewMood(e.target.value)}
          ></textarea>
          <div className="flex justify-end">
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
                <div className="font-medium">{mood.author.name}</div>
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
    </div>
  );
};

export default Moods;
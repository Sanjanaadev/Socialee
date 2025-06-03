import { useState, useEffect } from 'react';
import { posts } from '../data/mockData';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { Post } from '../types';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';

const Home = () => {
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch with a delay
    const timer = setTimeout(() => {
      setFeedPosts(posts);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const breakpointColumns = {
    default: 3,
    1100: 2,
    700: 1
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading posts...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Home Feed</h1>
      
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {feedPosts.map((post, index) => (
          <motion.div
            key={post.id}
            className="card mb-4 hover:transform hover:scale-[1.02] transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <img 
              src={post.imageUrl} 
              alt={post.caption} 
              className="w-full h-auto rounded-t-lg"
            />
            <div className="p-4">
              <div className="flex items-center mb-3">
                <Link to={`/profile/${post.author.id}`}>
                  <img 
                    src={post.author.profilePic} 
                    alt={post.author.name} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </Link>
                <div className="ml-3">
                  <Link to={`/profile/${post.author.id}`} className="font-medium hover:text-accent-pink">
                    {post.author.name}
                  </Link>
                </div>
              </div>
              <p className="text-text-secondary mb-3">{post.caption}</p>
              <div className="flex justify-between text-text-muted">
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded-full hover:bg-background-light hover:text-accent-pink transition-colors">
                    <Heart size={18} />
                  </button>
                  <span className="text-sm">{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded-full hover:bg-background-light hover:text-accent-pink transition-colors">
                    <MessageCircle size={18} />
                  </button>
                  <span className="text-sm">{post.comments}</span>
                </div>
                <span className="text-xs">{post.createdAt}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </Masonry>
    </div>
  );
};

export default Home;
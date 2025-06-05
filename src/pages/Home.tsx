import { useState, useEffect } from 'react';
import { posts } from '../data/mockData';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Post, Comment } from '../types';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedPosts(posts.map(post => ({ ...post, comments: [], isLiked: false })));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLike = (postId: string) => {
    setFeedPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked
            }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    if (!newComments[postId]?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text: newComments[postId],
      author: user!,
      createdAt: 'just now'
    };

    setFeedPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      )
    );

    setNewComments(prev => ({ ...prev, [postId]: '' }));
  };

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
            className="card mb-4"
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
              
              {/* Actions */}
              <div className="flex justify-between text-text-muted mb-4">
                <button 
                  className={`flex items-center space-x-1 ${post.isLiked ? 'text-accent-pink' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={20} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likes}</span>
                </button>
                <div className="flex items-center space-x-1">
                  <MessageCircle size={20} />
                  <span>{post.comments?.length || 0}</span>
                </div>
                <span className="text-xs">{post.createdAt}</span>
              </div>

              {/* Comments */}
              <div className="space-y-3">
                {post.comments?.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <img 
                      src={comment.author.profilePic} 
                      alt={comment.author.name} 
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <div className="flex-1 bg-background-light rounded-lg p-2">
                      <p className="text-sm">
                        <span className="font-medium">{comment.author.name}</span>{' '}
                        {comment.text}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{comment.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  className="input flex-1 py-1"
                  placeholder="Add a comment..."
                  value={newComments[post.id] || ''}
                  onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button
                  className="p-2 text-accent-pink"
                  onClick={() => handleComment(post.id)}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </Masonry>
    </div>
  );
};

export default Home;
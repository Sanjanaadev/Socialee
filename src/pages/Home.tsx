import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Post, Comment } from '../types';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const Home = () => {
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  useEffect(() => {
    loadFeedPosts();
  }, []);

  const loadFeedPosts = async () => {
    try {
      const posts = await postsAPI.getFeedPosts();
      const formattedPosts = posts.map((post: any) => ({
        id: post._id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        author: {
          id: post.author._id,
          name: post.author.name,
          username: post.author.username,
          email: post.author.email || '',
          profilePic: post.author.profilePic || '',
          bio: post.author.bio || '',
          followers: 0,
          following: 0,
          posts: 0
        },
        likes: post.likes?.length || 0,
        comments: post.comments?.map((comment: any) => ({
          id: comment._id,
          text: comment.text,
          author: {
            id: comment.author._id,
            name: comment.author.name,
            username: comment.author.username,
            email: comment.author.email || '',
            profilePic: comment.author.profilePic || '',
            bio: comment.author.bio || '',
            followers: 0,
            following: 0,
            posts: 0
          },
          createdAt: formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
        })) || [],
        createdAt: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
        height: 350,
        isLiked: post.likes?.includes(user?.id) || false
      }));
      
      setFeedPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error loading feed:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to view your feed');
      } else {
        toast.error('Failed to load posts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await postsAPI.likePost(postId);
      
      setFeedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes: response.likes,
                isLiked: response.isLiked
              }
            : post
        )
      );
    } catch (error: any) {
      toast.error('Failed to like post');
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComments[postId]?.trim() || !user) return;

    try {
      const comment = await postsAPI.addComment(postId, newComments[postId]);
      
      const formattedComment: Comment = {
        id: comment._id,
        text: comment.text,
        author: {
          id: comment.author._id,
          name: comment.author.name,
          username: comment.author.username,
          email: comment.author.email || '',
          profilePic: comment.author.profilePic || '',
          bio: comment.author.bio || '',
          followers: 0,
          following: 0,
          posts: 0
        },
        createdAt: 'just now'
      };

      setFeedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments: [...post.comments, formattedComment] }
            : post
        )
      );

      setNewComments(prev => ({ ...prev, [postId]: '' }));
    } catch (error: any) {
      toast.error('Failed to add comment');
    }
  };

  const breakpointColumns = {
    default: 3,
    1100: 2,
    700: 1
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading your personalized feed...</div>
      </div>
    );
  }

  if (feedPosts.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Welcome to Socialee!</h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Your feed is empty. Start following other users to see their posts here, or create your first post!
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/create" className="btn-primary">
            Create Post
          </Link>
          <Link to="/snaps" className="btn-outline">
            Explore Snaps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <p className="text-text-secondary text-sm">
          {feedPosts.length} post{feedPosts.length !== 1 ? 's' : ''} from people you follow
        </p>
      </div>
      
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
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                    {post.author.profilePic ? (
                      <img 
                        src={post.author.profilePic} 
                        alt={post.author.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {post.author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="ml-3">
                  <Link to={`/profile/${post.author.id}`} className="font-medium hover:text-accent-pink">
                    {post.author.name}
                  </Link>
                  {post.author.id === user?.id && (
                    <span className="ml-2 text-xs bg-accent-pink text-white px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
              </div>
              <p className="text-text-secondary mb-3">{post.caption}</p>
              
              {/* Actions */}
              <div className="flex justify-between text-text-muted mb-4">
                <button 
                  className={`flex items-center space-x-1 transition-colors ${post.isLiked ? 'text-accent-pink' : 'hover:text-accent-pink'}`}
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
                    <div className="h-6 w-6 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                      {comment.author.profilePic ? (
                        <img 
                          src={comment.author.profilePic} 
                          alt={comment.author.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
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
                  className="p-2 text-accent-pink hover:bg-background-light rounded-md transition-colors"
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
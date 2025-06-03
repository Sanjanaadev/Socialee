import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { users, posts } from '../data/mockData';
import { User, Post } from '../types';
import { MessageSquare, UserPlus, Camera, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    // Determine which user to show
    // If userId is provided, find that user, otherwise show current user
    const targetUserId = userId || currentUser?.id || '1';
    
    // Simulate API fetch
    const timer = setTimeout(() => {
      const foundUser = users.find(u => u.id === targetUserId) || null;
      setProfileUser(foundUser);
      
      // Get posts by this user
      const userPosts = posts.filter(p => p.author.id === targetUserId);
      setUserPosts(userPosts);
      
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [userId, currentUser]);

  const isCurrentUser = profileUser?.id === currentUser?.id || profileUser?.id === '1';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">User Not Found</h2>
        <p className="text-text-secondary mb-6">The user you're looking for doesn't exist.</p>
        <Link to="/home" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cover and Profile Picture */}
        <div className="relative mb-16">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-accent-purple to-accent-pink rounded-lg"></div>
          
          {/* Profile Picture */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-12">
            <div className="relative">
              <img 
                src={profileUser.profilePic} 
                alt={profileUser.name} 
                className="h-24 w-24 rounded-full object-cover border-4 border-background-dark"
              />
              {isCurrentUser && (
                <button className="absolute bottom-0 right-0 bg-accent-pink h-8 w-8 rounded-full flex items-center justify-center">
                  <Camera size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{profileUser.name}</h1>
          <p className="text-text-secondary">@{profileUser.username}</p>
          <p className="mt-3 max-w-md mx-auto">{profileUser.bio}</p>
          
          {/* Stats */}
          <div className="flex justify-center items-center gap-8 mt-4">
            <div className="text-center">
              <p className="font-bold">{profileUser.posts}</p>
              <p className="text-text-secondary text-sm">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{profileUser.followers}</p>
              <p className="text-text-secondary text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{profileUser.following}</p>
              <p className="text-text-secondary text-sm">Following</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            {isCurrentUser ? (
              <button className="btn-outline flex items-center gap-2">
                <Settings size={18} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button className="btn-primary flex items-center gap-2">
                  <UserPlus size={18} />
                  <span>Follow</span>
                </button>
                <Link to={`/messages`} className="btn-outline flex items-center gap-2">
                  <MessageSquare size={18} />
                  <span>Message</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex justify-center gap-8">
          <button 
            className={`pb-3 px-2 ${activeTab === 'posts' ? 'border-b-2 border-accent-pink font-medium' : 'text-text-secondary'}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`pb-3 px-2 ${activeTab === 'saved' ? 'border-b-2 border-accent-pink font-medium' : 'text-text-secondary'}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </nav>
      </div>
      
      {/* Content */}
      {activeTab === 'posts' ? (
        userPosts.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            No posts yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {userPosts.map((post, index) => (
              <motion.div
                key={post.id}
                className="aspect-square rounded-lg overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <img 
                  src={post.imageUrl} 
                  alt={post.caption} 
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-10 text-text-secondary">
          No saved posts
        </div>
      )}
    </div>
  );
};

export default Profile;
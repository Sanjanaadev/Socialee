import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { users } from '../data/mockData';
import { User, Post } from '../types';
import { MessageSquare, UserPlus, Camera, Settings, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, registeredUsers, followUser, unfollowUser, isFollowing, followingUsers } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // If no userId is provided and we have a currentUser, use their data
    if (!userId && currentUser) {
      setProfileUser(currentUser);
      
      // Load user's posts from localStorage
      const storedPosts = localStorage.getItem(`socialee_posts_${currentUser.id}`);
      const posts = storedPosts ? JSON.parse(storedPosts) : [];
      setUserPosts(posts);
      
      setIsLoading(false);
      return;
    }

    // If userId is provided, find that user from registered users first, then fallback to mock users
    const targetUserId = userId || currentUser?.id || '1';
    let foundUser = registeredUsers.find(u => u.id === targetUserId) || 
                   users.find(u => u.id === targetUserId) || null;
    
    // If it's a registered user, get their updated follower/following counts
    if (foundUser && registeredUsers.some(u => u.id === foundUser.id)) {
      const storedFollowing = localStorage.getItem(`socialee_following_${foundUser.id}`);
      const storedFollowers = localStorage.getItem(`socialee_followers_${foundUser.id}`);
      
      foundUser = {
        ...foundUser,
        following: storedFollowing ? JSON.parse(storedFollowing).length : 0,
        followers: storedFollowers ? JSON.parse(storedFollowers).length : 0
      };

      // Load followers list for this user
      if (storedFollowers) {
        setFollowersList(JSON.parse(storedFollowers));
      }

      // Load user's posts from localStorage
      const storedPosts = localStorage.getItem(`socialee_posts_${foundUser.id}`);
      const posts = storedPosts ? JSON.parse(storedPosts) : [];
      setUserPosts(posts);
    }
    
    setProfileUser(foundUser);
    setIsLoading(false);
  }, [userId, currentUser, registeredUsers]);

  const isCurrentUser = !userId || (profileUser?.id === currentUser?.id);
  const isUserFollowing = profileUser ? isFollowing(profileUser.id) : false;

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleFollow = () => {
    if (!profileUser || !currentUser || isCurrentUser) return;

    if (isUserFollowing) {
      unfollowUser(profileUser.id);
    } else {
      followUser(profileUser.id);
    }

    // Update the profile user's follower count in real-time
    const storedFollowers = localStorage.getItem(`socialee_followers_${profileUser.id}`);
    const followersList = storedFollowers ? JSON.parse(storedFollowers) : [];
    const newFollowerCount = isUserFollowing ? followersList.length - 1 : followersList.length + 1;
    
    setProfileUser(prev => prev ? { ...prev, followers: newFollowerCount } : null);

    // Update followers list
    if (isUserFollowing) {
      setFollowersList(prev => prev.filter(f => f.id !== currentUser.id));
    } else {
      setFollowersList(prev => [...prev, currentUser]);
    }
  };

  const handleFollowingClick = () => {
    if (isCurrentUser) {
      setShowFollowingModal(true);
    }
  };

  const handleFollowersClick = () => {
    setShowFollowersModal(true);
  };

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
              <p className="font-bold">{userPosts.length}</p>
              <p className="text-text-secondary text-sm">Posts</p>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-background-light rounded-lg px-3 py-2 transition-colors" 
              onClick={handleFollowersClick}
            >
              <p className="font-bold">{profileUser.followers || 0}</p>
              <p className="text-text-secondary text-sm">Followers</p>
            </div>
            <div 
              className={`text-center rounded-lg px-3 py-2 transition-colors ${
                isCurrentUser ? 'cursor-pointer hover:bg-background-light' : 'cursor-default'
              }`}
              onClick={handleFollowingClick}
            >
              <p className="font-bold">{profileUser.following || 0}</p>
              <p className="text-text-secondary text-sm">Following</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            {isCurrentUser ? (
              <button 
                className="btn-outline flex items-center gap-2"
                onClick={handleEditProfile}
              >
                <Settings size={18} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button 
                  className={`btn-primary flex items-center gap-2 ${isUserFollowing ? 'bg-background-light hover:bg-background-card text-text-primary' : ''}`}
                  onClick={handleFollow}
                >
                  {isUserFollowing ? (
                    <>
                      <UserCheck size={18} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Follow</span>
                    </>
                  )}
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
            {isCurrentUser ? (
              <div>
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="mb-4">Share your first post to get started!</p>
                <Link to="/create" className="btn-primary">
                  Create Post
                </Link>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p>{profileUser.name} hasn't shared any posts.</p>
              </div>
            )}
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

      {/* Following Modal */}
      <AnimatePresence>
        {showFollowingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full max-h-96 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Following</h2>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-80">
                {followingUsers.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    Not following anyone yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followingUsers.map((followedUser) => (
                      <div key={followedUser.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src={followedUser.profilePic} 
                            alt={followedUser.name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <p className="font-medium">{followedUser.name}</p>
                            <p className="text-sm text-text-secondary">@{followedUser.username}</p>
                          </div>
                        </div>
                        <Link 
                          to={`/profile/${followedUser.id}`}
                          className="btn-outline text-sm px-3 py-1"
                          onClick={() => setShowFollowingModal(false)}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full max-h-96 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Followers</h2>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-80">
                {followersList.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    No followers yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followersList.map((follower) => (
                      <div key={follower.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src={follower.profilePic} 
                            alt={follower.name} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="ml-3">
                            <p className="font-medium">{follower.name}</p>
                            <p className="text-sm text-text-secondary">@{follower.username}</p>
                          </div>
                        </div>
                        <Link 
                          to={`/profile/${follower.id}`}
                          className="btn-outline text-sm px-3 py-1"
                          onClick={() => setShowFollowersModal(false)}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
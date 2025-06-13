import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Post } from '../types';
import { MessageSquare, UserPlus, Camera, Settings, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usersAPI, postsAPI, savedPostsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, followUser, unfollowUser, isFollowing, followingUsers } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      // Load user profile
      const userData = await usersAPI.getProfile(targetUserId);
      const formattedUser: User = {
        id: userData._id,
        name: userData.name,
        username: userData.username,
        email: userData.email || '',
        profilePic: userData.profilePic || '',
        bio: userData.bio || '',
        followers: userData.followers?.length || 0,
        following: userData.following?.length || 0,
        posts: 0 // Will be updated after loading posts
      };

      setProfileUser(formattedUser);
      setFollowersList(userData.followers || []);

      // Load user posts
      const posts = await postsAPI.getUserPosts(targetUserId);
      const formattedPosts = posts.map((post: any) => ({
        id: post._id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        author: formattedUser,
        likes: post.likes?.length || 0,
        comments: post.comments || [],
        createdAt: new Date(post.createdAt).toLocaleDateString(),
        height: 350
      }));

      setUserPosts(formattedPosts);
      
      // Update posts count
      setProfileUser(prev => prev ? { ...prev, posts: formattedPosts.length } : null);

      // Load saved posts if viewing own profile
      if (isCurrentUser) {
        try {
          const savedPostsData = await savedPostsAPI.getSavedPosts();
          setSavedPosts(savedPostsData.map((post: any) => ({
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
            comments: post.comments || [],
            createdAt: new Date(post.createdAt).toLocaleDateString(),
            height: 350
          })));
        } catch (error) {
          console.error('Error loading saved posts:', error);
        }
      }

    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentUser = !userId || (profileUser?.id === currentUser?.id);
  const isUserFollowing = profileUser ? isFollowing(profileUser.id) : false;

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleFollow = async () => {
    if (!profileUser || !currentUser || isCurrentUser) return;

    try {
      if (isUserFollowing) {
        await unfollowUser(profileUser.id);
        setProfileUser(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
        setFollowersList(prev => prev.filter(f => f._id !== currentUser.id));
      } else {
        await followUser(profileUser.id);
        setProfileUser(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
        setFollowersList(prev => [...prev, currentUser]);
      }
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  const handleMessage = () => {
    if (!profileUser || isCurrentUser) return;
    navigate(`/messages/${profileUser.id}`);
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
              <div className="h-24 w-24 rounded-full overflow-hidden bg-background-light flex items-center justify-center border-4 border-background-dark">
                {profileUser.profilePic ? (
                  <img 
                    src={profileUser.profilePic} 
                    alt={profileUser.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-text-secondary">
                    {profileUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
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
                <button 
                  className="btn-outline flex items-center gap-2"
                  onClick={handleMessage}
                >
                  <MessageSquare size={18} />
                  <span>Message</span>
                </button>
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
          {isCurrentUser && (
            <button 
              className={`pb-3 px-2 ${activeTab === 'saved' ? 'border-b-2 border-accent-pink font-medium' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
          )}
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
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        savedPosts.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <h3 className="text-lg font-medium mb-2">No saved posts</h3>
            <p>Posts you save will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {savedPosts.map((post, index) => (
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
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
            ))}
          </div>
        )
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
                      <div key={followedUser.id || followedUser._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                            {followedUser.profilePic ? (
                              <img 
                                src={followedUser.profilePic} 
                                alt={followedUser.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-medium">
                                {followedUser.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{followedUser.name}</p>
                            <p className="text-sm text-text-secondary">@{followedUser.username}</p>
                          </div>
                        </div>
                        <Link 
                          to={`/profile/${followedUser.id || followedUser._id}`}
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
                      <div key={follower._id || follower.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                            {follower.profilePic ? (
                              <img 
                                src={follower.profilePic} 
                                alt={follower.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-medium">
                                {follower.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{follower.name}</p>
                            <p className="text-sm text-text-secondary">@{follower.username}</p>
                          </div>
                        </div>
                        <Link 
                          to={`/profile/${follower._id || follower.id}`}
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
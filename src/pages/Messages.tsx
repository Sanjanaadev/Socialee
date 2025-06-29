import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MessageSquare, User, Trash2, MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ConversationData {
  conversationId: string;
  otherParticipant: {
    _id: string;
    id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  lastMessage: {
    _id: string;
    text: string;
    sender: {
      _id: string;
      name: string;
    };
    createdAt: string;
  };
  unreadCount: number;
}

const Messages = () => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    loadConversations();
  }, []);

  // Reload conversations when returning to messages page
  useEffect(() => {
    if (location.pathname === '/messages') {
      loadConversations();
    }
  }, [location.pathname]);

  const loadConversations = async () => {
    try {
      const conversationsData = await messagesAPI.getConversations();
      console.log('Loaded conversations:', conversationsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = (conversation: ConversationData) => {
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
    setShowOptionsMenu({});
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const userId = conversationToDelete.otherParticipant._id || conversationToDelete.otherParticipant.id;
      await messagesAPI.deleteConversation(userId);
      
      // Remove conversation from list
      setConversations(prev => 
        prev.filter(conv => conv.conversationId !== conversationToDelete.conversationId)
      );
      
      toast.success('Conversation deleted successfully');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete conversation';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  const toggleOptionsMenu = (conversationId: string) => {
    setShowOptionsMenu(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowOptionsMenu({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() === ''
    ? conversations
    : conversations.filter(conversation => {
        const otherParticipant = conversation.otherParticipant;
        return otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase());
      });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading messages...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-text-secondary text-sm">
          Your conversations
        </p>
      </div>
      
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-secondary" />
          </div>
          <input 
            type="text" 
            className="input pl-10"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Conversations list */}
      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-text-secondary py-16">
            {searchQuery ? (
              <div>
                <h2 className="text-xl font-bold mb-4">No conversations found</h2>
                <p>Try searching for a different name or username.</p>
              </div>
            ) : (
              <div>
                <MessageSquare size={64} className="mx-auto mb-4 text-text-muted" />
                <h2 className="text-xl font-bold mb-4">No Messages Yet</h2>
                <p className="mb-6">
                  Start conversations by visiting someone's profile and clicking the message button.
                </p>
                <Link to="/home" className="btn-primary">
                  Discover People
                </Link>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation, index) => (
            <motion.div
              key={conversation.conversationId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="card p-4 hover:bg-background-light transition-colors relative group"
            >
              <div className="flex items-center">
                <div className="relative">
                  <Link 
                    to={`/profile/${conversation.otherParticipant._id || conversation.otherParticipant.id}`}
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-background-light flex items-center justify-center hover:ring-2 hover:ring-accent-pink transition-all">
                      {conversation.otherParticipant.profilePic ? (
                        <img 
                          src={conversation.otherParticipant.profilePic} 
                          alt={conversation.otherParticipant.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-text-secondary" />
                      )}
                    </div>
                  </Link>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent-pink rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  to={`/messages/${conversation.otherParticipant._id || conversation.otherParticipant.id}`}
                  className="ml-3 flex-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium hover:text-accent-pink transition-colors">
                      {conversation.otherParticipant.name}
                    </div>
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate mt-1 ${
                      conversation.unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'
                    }`}>
                      {conversation.lastMessage.sender._id === user?.id ? 'You: ' : ''}
                      {conversation.lastMessage.text}
                    </p>
                    <Link 
                      to={`/profile/${conversation.otherParticipant._id || conversation.otherParticipant.id}`}
                      className="text-xs text-accent-pink hover:underline ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{conversation.otherParticipant.username}
                    </Link>
                  </div>
                </Link>

                {/* Options menu */}
                <div className="relative ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOptionsMenu(conversation.conversationId);
                    }}
                    className="p-2 rounded-full hover:bg-background-card transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={16} className="text-text-secondary" />
                  </button>

                  <AnimatePresence>
                    {showOptionsMenu[conversation.conversationId] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-background-card border border-border rounded-lg shadow-lg z-10 min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeleteConversation(conversation)}
                          className="w-full px-4 py-2 text-left text-error hover:bg-background-light transition-colors rounded-lg flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          <span>Delete Conversation</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && conversationToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background-card rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Delete Conversation</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to delete your conversation with{' '}
                <span className="font-medium text-text-primary">
                  {conversationToDelete.otherParticipant.name}
                </span>
                ? All messages will be permanently deleted and this action cannot be undone.
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
                  onClick={confirmDeleteConversation}
                  className="btn bg-error hover:bg-opacity-90 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Conversation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
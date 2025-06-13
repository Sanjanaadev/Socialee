import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const conversationsData = await messagesAPI.getConversations();
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            >
              <Link 
                to={`/messages/${conversation.otherParticipant.id}`}
                className="block card p-4 hover:bg-background-light transition-colors"
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
                      {conversation.otherParticipant.profilePic ? (
                        <img 
                          src={conversation.otherParticipant.profilePic} 
                          alt={conversation.otherParticipant.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-medium">
                          {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent-pink rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{conversation.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{conversation.otherParticipant.name}</h3>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate mt-1">
                      {conversation.lastMessage.sender.id === user?.id ? 'You: ' : ''}
                      {conversation.lastMessage.text}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
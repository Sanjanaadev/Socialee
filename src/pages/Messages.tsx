import { useState, useEffect } from 'react';
import { conversations } from '../data/mockData';
import { Conversation } from '../types';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Messages = () => {
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setUserConversations(conversations);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() === ''
    ? userConversations
    : userConversations.filter(conversation => {
        const otherParticipant = conversation.participants.find(p => p.id !== '1'); // 1 is current user
        if (!otherParticipant) return false;
        
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
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
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
          <div className="text-center text-text-secondary py-8">
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </div>
        ) : (
          filteredConversations.map((conversation, index) => {
            // Get the other participant (not the current user)
            const otherParticipant = conversation.participants.find(p => p.id !== '1');
            if (!otherParticipant) return null;
            
            return (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link 
                  to={`/messages/${conversation.id}`}
                  className="block card p-4 hover:bg-background-light transition-colors"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <img 
                        src={otherParticipant.profilePic} 
                        alt={otherParticipant.name} 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent-pink rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">{conversation.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{otherParticipant.name}</h3>
                        <span className="text-xs text-text-muted">{conversation.lastMessage.createdAt}</span>
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-1">
                        {conversation.lastMessage.text}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Messages;
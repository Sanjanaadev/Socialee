import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConversationMessages, conversations } from '../data/mockData';
import { Message, User } from '../types';
import { ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Conversation = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Get conversation details
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      // Find the other user (not the current user)
      const other = conversation.participants.find(p => p.id !== '1');
      if (other) setOtherUser(other);
    }

    // Simulate API fetch
    const timer = setTimeout(() => {
      const fetchedMessages = getConversationMessages(conversationId);
      setMessages(fetchedMessages);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' || !otherUser) return;
    
    // Create a new message
    const newMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: {
        id: '1',
        name: 'Alex Morgan',
        username: 'alex_morgan',
        email: 'alex@example.com',
        profilePic: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600',
        bio: 'Digital artist & photographer',
        followers: 1243,
        following: 567,
        posts: 86
      },
      receiver: otherUser,
      text: newMessage,
      createdAt: 'just now',
      read: true
    };
    
    // Add to messages
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center border-b border-border pb-4 mb-4">
        <Link to="/messages" className="mr-3 p-2 rounded-full hover:bg-background-light">
          <ArrowLeft size={20} />
        </Link>
        {otherUser && (
          <div className="flex items-center">
            <img 
              src={otherUser.profilePic} 
              alt={otherUser.name} 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="ml-3">
              <h2 className="font-medium">{otherUser.name}</h2>
              <p className="text-xs text-text-muted">@{otherUser.username}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="h-[calc(100%-8rem)] overflow-y-auto mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.id === '1';
              return (
                <motion.div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                    {!isCurrentUser && (
                      <img 
                        src={message.sender.profilePic} 
                        alt={message.sender.name} 
                        className="h-8 w-8 rounded-full object-cover mb-1"
                      />
                    )}
                    <div className={`px-4 py-2 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-accent-pink text-white rounded-tr-none' 
                        : 'bg-background-light text-text-primary rounded-tl-none'
                    }`}>
                      <p>{message.text}</p>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {message.createdAt}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-border pt-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input 
            type="text" 
            className="input flex-1"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-primary"
            disabled={newMessage.trim() === ''}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
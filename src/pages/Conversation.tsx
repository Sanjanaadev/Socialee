import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import { Message, User as UserType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const Conversation = () => {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;
    loadConversation();
  }, [userId]);

  // Mark conversation as read when component mounts or when returning to it
  useEffect(() => {
    if (userId && otherUser) {
      markConversationAsRead();
    }
  }, [userId, otherUser, location.pathname]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    if (!userId) return;

    try {
      // Load other user's profile
      const userData = await usersAPI.getProfile(userId);
      const formattedUser: UserType = {
        id: userData._id,
        name: userData.name,
        username: userData.username,
        email: userData.email || '',
        profilePic: userData.profilePic || '',
        bio: userData.bio || '',
        followers: userData.followers?.length || 0,
        following: userData.following?.length || 0,
        posts: 0
      };
      setOtherUser(formattedUser);

      // Load conversation messages
      const messagesData = await messagesAPI.getConversation(userId);
      const formattedMessages = messagesData.map((msg: any) => ({
        id: msg._id,
        sender: {
          id: msg.sender._id,
          name: msg.sender.name,
          username: msg.sender.username,
          email: msg.sender.email || '',
          profilePic: msg.sender.profilePic || '',
          bio: msg.sender.bio || '',
          followers: 0,
          following: 0,
          posts: 0
        },
        receiver: {
          id: msg.receiver._id,
          name: msg.receiver.name,
          username: msg.receiver.username,
          email: msg.receiver.email || '',
          profilePic: msg.receiver.profilePic || '',
          bio: msg.receiver.bio || '',
          followers: 0,
          following: 0,
          posts: 0
        },
        text: msg.text,
        createdAt: formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }),
        read: msg.read,
        conversationId: msg.conversationId
      }));
      setMessages(formattedMessages);

    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const markConversationAsRead = async () => {
    if (!userId) return;
    
    try {
      await messagesAPI.markConversationAsRead(userId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' || !otherUser || !user || isSending) return;
    
    setIsSending(true);
    
    try {
      const sentMessage = await messagesAPI.sendMessage(otherUser.id, newMessage.trim());
      
      const formattedMessage: Message = {
        id: sentMessage._id,
        sender: user,
        receiver: otherUser,
        text: sentMessage.text,
        createdAt: 'just now',
        read: true,
        conversationId: sentMessage.conversationId
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-accent-pink">Loading conversation...</div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">User Not Found</h2>
        <p className="text-text-secondary mb-6">The user you're trying to message doesn't exist.</p>
        <Link to="/messages" className="btn-primary">
          Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header with clickable profile navigation */}
      <div className="flex items-center border-b border-border pb-4 mb-4">
        <Link to="/messages" className="mr-3 p-2 rounded-full hover:bg-background-light">
          <ArrowLeft size={20} />
        </Link>
        <Link 
          to={`/profile/${otherUser.id}`}
          className="flex items-center hover:bg-background-light rounded-lg p-2 transition-colors flex-1"
        >
          <div className="h-10 w-10 rounded-full overflow-hidden bg-background-light flex items-center justify-center">
            {otherUser.profilePic ? (
              <img 
                src={otherUser.profilePic} 
                alt={otherUser.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={20} className="text-text-secondary" />
            )}
          </div>
          <div className="ml-3">
            <h2 className="font-medium hover:text-accent-pink transition-colors">{otherUser.name}</h2>
            <p className="text-xs text-text-muted">@{otherUser.username}</p>
          </div>
        </Link>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-background-light flex items-center justify-center mx-auto mb-4">
              {otherUser.profilePic ? (
                <img 
                  src={otherUser.profilePic} 
                  alt={otherUser.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={32} className="text-text-secondary" />
              )}
            </div>
            <h3 className="font-medium mb-2">Start a conversation with {otherUser.name}</h3>
            <p className="text-sm">Send a message to begin chatting.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.id === user?.id;
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
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-background-light flex items-center justify-center mb-1">
                        {message.sender.profilePic ? (
                          <img 
                            src={message.sender.profilePic} 
                            alt={message.sender.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-text-secondary" />
                        )}
                      </div>
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
            placeholder={`Message ${otherUser.name}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={1000}
          />
          <button 
            type="submit" 
            className="btn-primary"
            disabled={newMessage.trim() === '' || isSending}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
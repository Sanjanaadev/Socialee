import { User, Post, Snap, Mood, Conversation, Message } from '../types';
import { formatDistanceToNow, addHours } from 'date-fns';

// Mock Users
export const currentUser: User = {
  id: '1',
  name: 'Alex Morgan',
  username: 'alex_morgan',
  email: 'alex@example.com',
  profilePic: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600',
  bio: 'Digital artist & photographer | Exploring the world one click at a time',
  followers: 1243,
  following: 567,
  posts: 86
};

export const users: User[] = [
  currentUser,
  {
    id: '2',
    name: 'Jordan Lee',
    username: 'jordan_creates',
    email: 'jordan@example.com',
    profilePic: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600',
    bio: 'Graphic designer with a passion for minimal aesthetics',
    followers: 4512,
    following: 231,
    posts: 102
  },
  {
    id: '3',
    name: 'Taylor Swift',
    username: 'taylor_swift',
    email: 'taylor@example.com',
    profilePic: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    bio: 'Travel enthusiast | Coffee addict | Always planning my next trip',
    followers: 15243,
    following: 342,
    posts: 267
  },
  {
    id: '4',
    name: 'Jamie Chen',
    username: 'jamie_chen',
    email: 'jamie@example.com',
    profilePic: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
    bio: 'Fitness coach & nutrition specialist | Healthy mind, healthy body',
    followers: 9872,
    following: 526,
    posts: 198
  },
  {
    id: '5',
    name: 'Riley Johnson',
    username: 'riley_j',
    email: 'riley@example.com',
    profilePic: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=600',
    bio: 'Music producer | Dog lover | Living life one beat at a time',
    followers: 3219,
    following: 412,
    posts: 76
  }
];

// Mock Posts with random heights for masonry layout
export const posts: Post[] = [
  {
    id: '1',
    imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Sunset vibes #photography #nature',
    author: users[1],
    likes: 342,
    comments: 18,
    createdAt: formatDistanceToNow(new Date(2023, 3, 15), { addSuffix: true }),
    height: 350
  },
  {
    id: '2',
    imageUrl: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'City lights never sleep',
    author: users[2],
    likes: 523,
    comments: 32,
    createdAt: formatDistanceToNow(new Date(2023, 3, 16), { addSuffix: true }),
    height: 450
  },
  {
    id: '3',
    imageUrl: 'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Morning coffee is a ritual ☕',
    author: users[0],
    likes: 267,
    comments: 14,
    createdAt: formatDistanceToNow(new Date(2023, 3, 17), { addSuffix: true }),
    height: 300
  },
  {
    id: '4',
    imageUrl: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Weekend getaway to the mountains',
    author: users[3],
    likes: 876,
    comments: 43,
    createdAt: formatDistanceToNow(new Date(2023, 3, 18), { addSuffix: true }),
    height: 500
  },
  {
    id: '5',
    imageUrl: 'https://images.pexels.com/photos/2456348/pexels-photo-2456348.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Studio session with the band',
    author: users[4],
    likes: 432,
    comments: 27,
    createdAt: formatDistanceToNow(new Date(2023, 3, 19), { addSuffix: true }),
    height: 380
  },
  {
    id: '6',
    imageUrl: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'New art piece finished today',
    author: users[1],
    likes: 721,
    comments: 38,
    createdAt: formatDistanceToNow(new Date(2023, 3, 20), { addSuffix: true }),
    height: 320
  },
  {
    id: '7',
    imageUrl: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Sunday brunch with friends',
    author: users[2],
    likes: 542,
    comments: 29,
    createdAt: formatDistanceToNow(new Date(2023, 3, 21), { addSuffix: true }),
    height: 400
  },
  {
    id: '8',
    imageUrl: 'https://images.pexels.com/photos/2468339/pexels-photo-2468339.jpeg?auto=compress&cs=tinysrgb&w=600',
    caption: 'Gym progress 💪 #fitness',
    author: users[3],
    likes: 698,
    comments: 45,
    createdAt: formatDistanceToNow(new Date(2023, 3, 22), { addSuffix: true }),
    height: 480
  }
];

// Mock Snaps
export const snaps: Snap[] = [
  {
    id: '1',
    mediaUrl: 'https://images.pexels.com/photos/1683328/pexels-photo-1683328.jpeg?auto=compress&cs=tinysrgb&w=600',
    author: users[1],
    createdAt: formatDistanceToNow(new Date(), { addSuffix: true }),
    expiresAt: addHours(new Date(), 24).toISOString()
  },
  {
    id: '2',
    mediaUrl: 'https://images.pexels.com/photos/33041/antelope-canyon-lower-canyon-arizona.jpg?auto=compress&cs=tinysrgb&w=600',
    author: users[2],
    createdAt: formatDistanceToNow(new Date(), { addSuffix: true }),
    expiresAt: addHours(new Date(), 24).toISOString()
  },
  {
    id: '3',
    mediaUrl: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=600',
    author: users[3],
    createdAt: formatDistanceToNow(new Date(), { addSuffix: true }),
    expiresAt: addHours(new Date(), 24).toISOString()
  },
  {
    id: '4',
    mediaUrl: 'https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=600',
    author: users[4],
    createdAt: formatDistanceToNow(new Date(), { addSuffix: true }),
    expiresAt: addHours(new Date(), 24).toISOString()
  }
];

// Mock Moods
export const moods: Mood[] = [
  {
    id: '1',
    text: 'Feeling inspired today. New project coming soon!',
    author: users[1],
    likes: 43,
    createdAt: formatDistanceToNow(new Date(), { addSuffix: true })
  },
  {
    id: '2',
    text: 'Just finished reading an amazing book. Highly recommended!',
    author: users[2],
    likes: 27,
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 30), { addSuffix: true })
  },
  {
    id: '3',
    text: 'Mondays... need more coffee ☕',
    author: users[0],
    likes: 65,
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 60), { addSuffix: true })
  },
  {
    id: '4',
    text: 'Just hit a new personal record at the gym! 💪',
    author: users[3],
    likes: 89,
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 90), { addSuffix: true })
  },
  {
    id: '5',
    text: 'New music dropping this weekend. Stay tuned!',
    author: users[4],
    likes: 112,
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 120), { addSuffix: true })
  }
];

// Mock Messages
const messages: Message[] = [
  {
    id: '1',
    sender: users[1],
    receiver: users[0],
    text: 'Hey, how are you doing?',
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 10), { addSuffix: true }),
    read: true
  },
  {
    id: '2',
    sender: users[0],
    receiver: users[1],
    text: 'I\'m good! Just working on some new designs. How about you?',
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 9), { addSuffix: true }),
    read: true
  },
  {
    id: '3',
    sender: users[1],
    receiver: users[0],
    text: 'Nice! I\'m just planning a new photoshoot for the weekend. Want to collaborate?',
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 8), { addSuffix: true }),
    read: true
  },
  {
    id: '4',
    sender: users[2],
    receiver: users[0],
    text: 'Hey Alex! Are you coming to the event tonight?',
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 60), { addSuffix: true }),
    read: false
  },
  {
    id: '5',
    sender: users[3],
    receiver: users[0],
    text: 'Just saw your latest post. Amazing work!',
    createdAt: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 120), { addSuffix: true }),
    read: false
  }
];

// Mock Conversations
export const conversations: Conversation[] = [
  {
    id: '1',
    participants: [users[0], users[1]],
    lastMessage: messages[2],
    unreadCount: 0
  },
  {
    id: '2',
    participants: [users[0], users[2]],
    lastMessage: messages[3],
    unreadCount: 1
  },
  {
    id: '3',
    participants: [users[0], users[3]],
    lastMessage: messages[4],
    unreadCount: 1
  }
];

// Export message history for a specific conversation
export const getConversationMessages = (conversationId: string): Message[] => {
  if (conversationId === '1') {
    return [messages[0], messages[1], messages[2]];
  }
  if (conversationId === '2') {
    return [messages[3]];
  }
  if (conversationId === '3') {
    return [messages[4]];
  }
  return [];
};
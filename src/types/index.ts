export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePic: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
}

export interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  author: User;
  likes: number;
  comments: Comment[];
  createdAt: string;
  height?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Snap {
  id: string;
  mediaUrl: string;
  author: User;
  createdAt: string;
  expiresAt: string;
}

export interface Mood {
  id: string;
  text: string;
  author: User;
  likes: number;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: User;
  receiver: User;
  text: string;
  createdAt: string;
  read: boolean;
  conversationId?: string;
}

export interface Conversation {
  conversationId: string;
  otherParticipant: User;
  lastMessage: Message;
  unreadCount: number;
}
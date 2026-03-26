export enum UserRole {
  STUDENT = 'Student',
  NON_STUDENT = 'Non-Student',
  LEADER = 'Leader',
  TRAINER = 'Trainer',
  GUEST = 'Guest'
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole | string;
  studentId?: string;
  profilePic?: string;
  bio?: string;
  points: number;
  rank?: number;
  joinedAt: string;
  isVerified?: boolean;
  stewardshipKey?: string;
  settings?: {
    hideOnLeaderboard?: boolean;
  };
}

export interface DailyContent {
  verse: string;
  verseRef: string;
  saintName: string;
  saintFeast: string;
  saintPatronage: string;
  saintBio: string;
  saintImage?: string;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole | string;
  userPic?: string;
  content: string;
  timestamp: number;
  amens?: number;
  media?: {
    type: MediaType;
    url: string;
    fileName?: string;
  };
}

export interface UpdateComment {
  id: string;
  userId: string;
  userName: string;
  userPic?: string;
  text: string;
  timestamp: number;
}

export interface UpdatePost {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  category: 'Event' | 'Notice' | 'Technical';
  registrations?: string[]; // Array of user IDs
  comments?: UpdateComment[];
}

export interface PrayerPetition {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  likes: number;
  isAnonymous?: boolean;
}

export interface ChoirMaterial {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  url: string;
  fileName?: string;
  uploadedBy: string;
  uploaderName: string;
  timestamp: number;
}

export interface PaymentCollection {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  category: 'Tithes' | 'Events' | 'Charity' | 'Projects';
  deadline?: string;
  icon: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName?: string;
  collectionId: string;
  collectionTitle: string;
  amount: number;
  timestamp: number;
  method: 'M-Pesa' | 'Card' | 'Bank';
}

export type View = 'Home' | 'Trivia' | 'Chat' | 'Profile' | 'Updates' | 'Requests' | 'Audio' | 'Payments' | 'AdminVault' | 'Briefing' | 'FaithAI' | 'Archive';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success';
}
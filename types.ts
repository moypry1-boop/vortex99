export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin' | 'support' | 'manager' | 'bot_manager';
  createdAt: string;
}

export interface GameServer {
  id: string;
  game: 'FiveM' | 'Minecraft' | 'CS2' | 'Rust';
  provider: string;
  planName: string;
  ram: string;
  cpu: string;
  storage: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface Booking {
  id: string;
  userId: string;
  serverId: string;
  game: string;
  planName: string;
  status: 'pending' | 'active' | 'expired';
  paymentMethod: 'Vodafone Cash' | 'Credit Card';
  expiryDate: string;
  createdAt: string;
  serverIp?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: number;
  userId: string;
  subject: string;
  message: string;
  screenshotUrl?: string;
  status: 'open' | 'closed' | 'pending_payment' | 'replied';
  createdAt: string;
  botResponse?: string;
  replies?: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
    isAdmin?: boolean;
  }[];
}

export interface StaffApplication {
  id: string;
  userId: string;
  name: string;
  experience: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Product {
  id: string;
  category: 'Server' | 'Script' | 'Charging';
  subCategory?: string; // e.g., 'FiveM Cars', 'TikTok Coins'
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  purchaseLink?: string;
  features: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promotion';
  link?: string;
  createdAt: string;
  authorId?: string;
  authorName?: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  iconUrl: string;
}

export interface AdminConfig {
  siteName: string;
  siteLogo: string;
  sitePassword?: string;
  vodafoneNumber: string;
  etisalatNumber: string;
  socialLinks: SocialLink[];
  botName: string;
  botEnabledSubjects: string[];
  botMessages: {
    paymentApproved: string;
    welcomeMessage: string;
  };
}

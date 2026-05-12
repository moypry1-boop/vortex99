import { GameServer, AdminConfig } from './types';

export const GAMES = [
  { id: 'FiveM', name: 'FiveM', icon: 'Server', color: 'bg-red-600' },
  { id: 'Minecraft', name: 'Minecraft', icon: 'Box', color: 'bg-green-500' },
  { id: 'CS2', name: 'Counter-Strike 2', icon: 'Target', color: 'bg-blue-500' },
  { id: 'Rust', name: 'Rust', icon: 'Shield', color: 'bg-red-500' },
];

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  siteName: 'GameHost AR',
  siteLogo: 'https://ais-dev-23pl3xoysv7scf6knbhxcb-506587197396.europe-west2.run.app/logo.png',
  sitePassword: '',
  vodafoneNumber: '01011070956',
  etisalatNumber: '01120388971',
  socialLinks: [
    { id: '1', name: 'ديسكورد', url: '', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3670/3670157.png' },
    { id: '2', name: 'فيسبوك', url: '', iconUrl: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
    { id: '3', name: 'تيك توك', url: '', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' }
  ],
  botName: 'مساعد الدعم الفني',
  botEnabledSubjects: ['تأكيد دفع'],
  botMessages: {
    paymentApproved: 'تم تأكيد الدفع بنجاح! إليك بيانات السيرفر الخاص بك:\nIP: {IP}\nUsername: root\nPassword: {PASSWORD}\nشكراً لتعاملك معنا!',
    welcomeMessage: 'مرحباً بك في نظام الدعم الفني. يرجى إرفاق سكرين شوت التحويل إذا كنت تفتح تذكرة لتأكيد الدفع.'
  }
};

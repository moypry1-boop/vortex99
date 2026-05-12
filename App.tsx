import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Zap, Globe, Cpu, HardDrive, ChevronRight, Menu, X, 
  LayoutDashboard, LogOut, MessageSquare, Plus, CheckCircle2, AlertCircle, 
  ShieldCheck, UserPlus, Phone, Save, Star, Quote, ShoppingCart, CreditCard, Link as LinkIcon, Bot, ShoppingBag, Sparkles, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, signOutUser, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, doc, getDoc, setDoc, orderBy, updateDoc, limit } from 'firebase/firestore';
import { UserProfile, Product, Booking, SupportTicket, AdminConfig, Review } from './types';
import { DEFAULT_ADMIN_CONFIG } from './constants';
import { PaymentModal } from './components/PaymentModal';
import { AdminPanel } from './components/AdminPanel';
import { StaffApplication } from './components/StaffApplication';
import { generateTicketResponse } from './services/geminiService';
import { Announcement } from './types';

const NotificationToast = ({ announcement, onClose }: { announcement: Announcement, onClose: () => void }) => (
  <motion.div 
    initial={{ x: 400, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 400, opacity: 0 }}
    className="fixed bottom-8 right-8 z-[200] max-w-sm"
  >
    <div className="bg-zinc-900 border border-red-600/30 rounded-3xl p-6 shadow-2xl shadow-red-600/10 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
      <button onClick={onClose} className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
      <div className="flex items-start gap-4 text-right">
        <div className="flex-1">
          <h4 className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">إشعار جديد</h4>
          <h3 className="text-white font-black mb-2 text-lg leading-tight">{announcement.title}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">{announcement.message}</p>
          {announcement.link && (
            <a href={announcement.link} className="inline-flex items-center gap-2 text-red-600 font-bold text-xs hover:gap-3 transition-all">
              شاهد التفاصيل <ChevronRight size={14} />
            </a>
          )}
        </div>
        <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
          <Zap size={24} />
        </div>
      </div>
    </div>
  </motion.div>
);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "حدث خطأ غير متوقع. يرجى تحديث الصفحة.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error && parsedError.error.includes('insufficient permissions')) {
          errorMessage = "عذراً، ليس لديك الصلاحيات الكافية للقيام بهذه العملية أو عرض هذه البيانات.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] max-w-lg w-full shadow-2xl">
            <div className="w-20 h-20 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">عذراً، حدث خطأ ما</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AnnouncementBar = ({ announcements }: { announcements: Announcement[] }) => {
  const displayAnnouncements = announcements.length > 0 
    ? announcements 
    : [{ id: 'default', title: 'Welcome to BIBO PLATINUM', message: 'The next generation of digital excellence.', type: 'info' }];

  return (
    <div className="fixed top-0 left-0 right-0 z-[120] h-12 bg-black backdrop-blur-3xl border-b border-white/5 overflow-hidden flex items-center px-6 shadow-2xl">
      <div className="max-w-7xl mx-auto w-full flex items-center h-full">
        <div className="h-full bg-red-600 px-6 sm:px-10 flex items-center gap-3 relative overflow-hidden shrink-0 group">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles size={16} className="text-white" />
          </motion.div>
          <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] whitespace-nowrap">News Feed</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
        </div>
        <div className="flex-1 marquee relative h-full">
          <div className="marquee-content h-full flex items-center">
            {[...displayAnnouncements, ...displayAnnouncements, ...displayAnnouncements].map((ann, i) => (
              <div key={i} className="flex items-center gap-14 px-12">
                <p className="text-xs font-bold text-zinc-300 tracking-tight whitespace-nowrap flex items-center gap-4">
                  <span className="text-red-600 text-[10px]">•</span>
                  <span className="text-white font-black uppercase tracking-wider">{ann.title}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-zinc-500 font-medium italic">{ann.message}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black via-black/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, activeTab, setActiveTab, onApplyStaff, config }: any) => (
  <nav className="fixed top-20 left-0 right-0 z-[100] px-6">
    <div className="max-w-7xl mx-auto">
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl h-18 flex items-center justify-between px-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] group/nav hover:bg-black/60 transition-all duration-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/40 border-2 border-white/20 overflow-hidden relative"
            >
              {config.siteLogo ? (
                <img src={config.siteLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Zap size={26} className="text-white fill-white animate-pulse" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
            </motion.div>
            <div className="flex flex-col relative overflow-hidden h-12 justify-center pr-2">
              <motion.div
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col"
              >
                <span className="text-2xl font-black text-white tracking-tighter uppercase font-display cyber-gradient-text leading-none">
                  {config.siteName || 'BIBO'}
                </span>
                <span className="text-[10px] font-black text-red-600 italic tracking-[0.3em] mt-1">PLATINUM.TECH</span>
              </motion.div>
              <motion.div 
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] pointer-events-none"
              />
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-10">
            {[
              { id: 'home', label: 'الرئيسية' },
              { id: 'products', label: 'المتجر الرسمي' },
              { id: 'support', label: 'مركز الدعم' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)} 
                className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${activeTab === item.id ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="nav-glow" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user && (['admin', 'support', 'manager', 'bot_manager'].includes(user?.role || '') || user?.email === 'moypry1@gmail.com') && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">الإدارة</span>
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-4 px-4 py-2 rounded-xl border border-white/10 transition-all ${activeTab === 'profile' ? 'bg-white/10 border-white/20 shadow-xl' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-lg border border-white/20" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <span className="text-[11px] font-black text-white hidden md:block uppercase tracking-widest">Dashboard</span>
              </button>
              <button onClick={signOutUser} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="px-8 py-3 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-600/30 active:scale-95"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Hero = ({ onStart, onContact, config }: any) => (
  <div className="relative pt-64 pb-48 px-6 overflow-hidden min-h-screen flex items-center bg-grid">
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial-gradient from-red-600/[0.07] to-transparent" />
      <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-red-600/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-red-900/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
    </div>

    <div className="max-w-7xl mx-auto text-center relative z-10 w-full pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-600/10 rounded-full border border-red-600/20 mb-10">
          <div className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
          <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.4em]">Next Gen Infrastructure</span>
        </div>
        
        <div className="relative mb-8 px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-[10vw] sm:text-[8vw] md:text-8xl lg:text-9xl font-display font-black leading-[0.85] tracking-[-0.06em] select-none text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          >
            <span className="cyber-gradient-text italic">BIBO</span><br />
            <span className="text-white brightness-125">PLATINUM</span>
          </motion.h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-red-600/5 blur-[120px] rounded-full z-[-1] pointer-events-none" />
        </div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-12 font-medium"
        >
          أقوى بنية تحتية رقمية في <span className="text-red-500 font-bold">الشرق الأوسط</span>. <br className="hidden md:block" />
          سيرفرات فائقة السرعة، حماية مطلقة، وتجربة لا تضاهى.
        </motion.p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart} 
            className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em]"
          >
            استكشف المتجر <ChevronRight size={16} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContact} 
            className="w-full sm:w-auto px-10 py-5 bg-zinc-900 text-white font-black rounded-2xl border border-white/10 hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em]"
          >
            تواصل معنا
          </motion.button>
        </div>
      </motion.div>
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    className="glass-card p-10 text-center group"
  >
    <div className="relative z-10">
      <div className="w-12 h-12 bg-white/5 border border-white/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
        <Icon size={24} />
      </div>
      <h4 className="text-4xl font-black text-white mb-1 font-display tracking-tighter leading-none">{value}</h4>
      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.5em] mt-3">{label}</p>
    </div>
  </motion.div>
);

const GameCard = ({ game, isSelected, onClick, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    whileHover={{ y: -8, scale: 1.01 }} 
    onClick={onClick} 
    className={`relative p-8 rounded-[2rem] border cursor-pointer transition-all duration-500 overflow-hidden group ${isSelected ? 'bg-red-600/5 border-red-600 shadow-2xl shadow-red-600/10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
  >
    <div className={`w-12 h-12 ${game.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
      {game.icon || <Zap className="text-white" size={24} />}
    </div>
    <h3 className="text-xl font-black text-white mb-2 font-display uppercase tracking-tight">{game.name}</h3>
    <p className="text-zinc-500 text-xs leading-relaxed mb-6 font-medium line-clamp-2">{game.description}</p>
    <div className="flex items-center gap-2 text-red-600 font-bold text-[9px] uppercase tracking-widest group-hover:gap-4 transition-all">
      الخطط المتاحة <ChevronRight size={12} />
    </div>
  </motion.div>
);

const ProductCard = ({ product, onSelect, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    className="glass-card p-6 flex flex-col h-full group"
  >
    <div className="relative h-56 -mx-6 -mt-6 mb-8 overflow-hidden rounded-t-3xl">
      <img src={product.imageUrl || 'https://picsum.photos/seed/product/800/600'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-600 text-[8px] font-black text-white uppercase tracking-widest rounded-full">
        {product.subCategory || product.category}
      </div>
    </div>
    <div className="flex justify-between items-start mb-6 text-right">
      <div className="w-full">
        <h3 className="text-2xl font-black text-white mb-2 leading-tight uppercase font-display">{product.name}</h3>
        <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-medium">{product.description}</p>
      </div>
    </div>
    <div className="space-y-3 mb-10 flex-1">
      {product.features?.slice(0, 4).map((f: string, i: number) => (
        <div key={i} className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
          <CheckCircle2 size={14} className="text-red-600" />
          {f}
        </div>
      ))}
    </div>
    <div className="pt-6 border-t border-white/10">
      <div className="flex items-baseline gap-2 justify-end mb-6">
        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{product.currency || 'EGP'}</span>
        <span className="text-4xl font-black text-white font-display tracking-tighter">{product.price}</span>
      </div>
      <motion.button 
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect} 
        className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
      >
        <ShoppingCart size={18} /> احجز الآن
      </motion.button>
    </div>
  </motion.div>
);

const ReviewCard = ({ review, delay = 0 }: { review: Review, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    className="bg-zinc-950/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] relative group hover:border-red-600/30 transition-all duration-500"
  >
    <div className="absolute -top-6 -right-6 w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-600/40 rotate-12 group-hover:rotate-0 transition-all duration-700">
      <Quote className="text-white" size={32} />
    </div>
    <div className="flex items-center gap-1.5 mb-8">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={18} className={i < review.rating ? "text-red-500 fill-red-500" : "text-zinc-800"} />
      ))}
    </div>
    <p className="text-zinc-200 text-lg leading-relaxed mb-10 font-medium italic text-right">"{review.comment}"</p>
    <div className="flex items-center gap-5 border-t border-white/5 pt-8">
      <div className="p-0.5 rounded-xl bg-gradient-to-br from-red-600 to-red-900">
        <img src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} alt={review.userName} className="w-12 h-12 rounded-[10px] object-cover" />
      </div>
      <div className="text-right">
        <h4 className="text-base font-black text-white uppercase tracking-tight leading-none mb-1">{review.userName}</h4>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('ar-EG')}</p>
      </div>
    </div>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [showPayment, setShowPayment] = useState<Product | null>(null);
  const [showStaffApp, setShowStaffApp] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  const handleUpdateConfig = async (newConfig: AdminConfig) => {
    try {
      await setDoc(doc(db, 'config', 'global'), newConfig);
      setConfig(newConfig);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'config');
      throw e;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'مستخدم جديد',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        } else {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        }

        // Listen for real-time updates to user profile
        const unsubUser = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) setUser({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
        });
        return () => unsubUser();
      } else setUser(null);
    });
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          ...DEFAULT_ADMIN_CONFIG,
          ...data,
          botMessages: {
            ...DEFAULT_ADMIN_CONFIG.botMessages,
            ...(data.botMessages || {})
          }
        } as AdminConfig);
      }
    });
    
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(12)), (snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))));
    
    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10)), (snap) => {
      const allAnnouncements = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(allAnnouncements);
      
      if (allAnnouncements.length > 0) {
        const latest = allAnnouncements[0];
        const createdAt = new Date(latest.createdAt).getTime();
        const now = new Date().getTime();
        if (now - createdAt < 1000 * 60 * 5) {
          setActiveAnnouncement(latest);
          setTimeout(() => setActiveAnnouncement(null), 10000);
        }
      }
    });

    return () => {
      unsubscribe();
      unsubConfig();
      unsubProducts();
      unsubReviews();
      unsubAnnouncements();
    };
  }, []);

  useEffect(() => {
    document.title = config.siteName || 'جيم هوست - أفضل استضافة سيرفرات';
  }, [config.siteName]);

  useEffect(() => {
    if (user) {
      const unsubBookings = onSnapshot(query(collection(db, 'bookings'), where('userId', '==', user.uid)), (snap) => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))));
      const unsubTickets = onSnapshot(query(collection(db, 'tickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')), (snap) => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket))));
      return () => { unsubBookings(); unsubTickets(); };
    }
  }, [user]);

  const handleCreateTicket = async (subject: string, message: string) => {
    if (!user || !subject || !message) return;
    try {
      // Check if bot is enabled for this subject
      const shouldBotRespond = config.botEnabledSubjects?.some(s => 
        subject.toLowerCase().includes(s.toLowerCase()) || 
        message.toLowerCase().includes(s.toLowerCase())
      );
      
      // Generate AI response if enabled
      let botResponse = '';
      if (shouldBotRespond) {
        botResponse = await generateTicketResponse(subject, message, config.siteName, config.botName || 'مساعد الدعم');
      }

      await addDoc(collection(db, 'tickets'), {
        ticketNumber: Math.floor(100000 + Math.random() * 900000),
        userId: user.uid,
        subject,
        message,
        status: 'open',
        createdAt: new Date().toISOString(),
        botResponse: botResponse || null
      });
      setProfileStatus({ type: 'success', message: 'تم فتح التذكرة بنجاح' });
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'tickets'); }
  };

  const handleBooking = async (data: any) => {
    if (!user || !showPayment) return;
    try {
      const subject = `تأكيد دفع: ${showPayment.name}`;
      const message = `طريقة الدفع: ${data.method}\nالرسالة: ${data.message}`;
      
      // Check if bot is enabled for this subject
      const shouldBotRespond = config.botEnabledSubjects?.some(s => 
        subject.toLowerCase().includes(s.toLowerCase()) || 
        message.toLowerCase().includes(s.toLowerCase())
      );
      
      // Generate AI response if enabled
      let botResponse = '';
      if (shouldBotRespond) {
        botResponse = await generateTicketResponse(subject, message, config.siteName, config.botName || 'مساعد الدعم');
      }

      await addDoc(collection(db, 'tickets'), {
        ticketNumber: Math.floor(100000 + Math.random() * 900000),
        userId: user.uid,
        subject,
        message,
        screenshotUrl: data.screenshot,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        botResponse: botResponse || null
      });
      setShowPayment(null); setActiveTab('profile');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'tickets'); }
  };

  const handleAddReview = async (data: { rating: number, comment: string }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        ...data,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: new Date().toISOString()
      });
      setShowAddReview(false);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'reviews'); }
  };

  const categories = [
    { id: 'servers', name: 'سيرفرات', description: 'استضافة سيرفرات ألعاب عالية الأداء', color: 'bg-red-600', icon: <Server size={28} /> },
    { id: 'scripts', name: 'سكربتات', description: 'سكربتات FiveM حصرية ومتطورة', color: 'bg-blue-600', icon: <Zap size={28} /> },
    { id: 'charging', name: 'شحن خدمات', description: 'شحن ألعاب وخدمات رقمية', color: 'bg-green-600', icon: <CreditCard size={28} /> }
  ];

  if (config.sitePassword && !siteUnlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 bg-mesh" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-black/80 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-600/10 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">الموقع محمي</h2>
          <p className="text-zinc-500 mb-8 text-sm">يرجى إدخال كلمة المرور للوصول إلى منصة {config.siteName}</p>
          <div className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-center focus:border-red-600 transition-all outline-none"
            />
            <button 
              onClick={() => {
                if (passwordInput === config.sitePassword) setSiteUnlocked(true);
                else setProfileStatus({ type: 'error', message: 'كلمة المرور غير صحيحة' });
              }}
              className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
            >
              دخول
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-red-600 selection:text-white" dir="rtl">
        <Navbar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onApplyStaff={() => setShowStaffApp(true)} config={config} />
        <AnnouncementBar announcements={announcements} />
        <main className="pt-32">
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero 
                config={config} 
                onStart={() => setActiveTab('products')} 
                onContact={() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }} 
              />
              
              <div className="max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
  <StatCard icon={Zap} value="99.9%" label="Availability" delay={0.1} />
  <StatCard icon={ShieldCheck} value="+1k" label="Transactions" delay={0.2} />
  <StatCard icon={Globe} value="24/7" label="Support Team" delay={0.3} />
</div>

              {/* Feature Grid */}
              <div className="max-w-7xl mx-auto px-6 py-24 border-y border-white/5 bg-zinc-950/20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 lg:row-span-2 p-10 bg-red-600 rounded-[2.5rem] text-white overflow-hidden relative group"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
                    <Zap className="mb-8 group-hover:rotate-12 transition-transform" size={48} />
                    <h3 className="text-4xl font-black mb-6 uppercase leading-tight font-display tracking-tighter cyber-gradient-text brightness-150">أداء بلا حدود في الشرق الأوسط</h3>
                    <p className="text-red-100 text-base leading-relaxed font-medium">سيرفراتنا تعمل بأحدث المعالجات (i9-14900K) لضمان أقصى سرعة استجابة لسيرفرات FiveM والألعاب المتطلبة.</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 p-10 bg-zinc-900 border border-white/5 rounded-[2.5rem] group"
                  >
                    <Shield className="text-red-600 mb-6" size={32} />
                    <h3 className="text-2xl font-black text-white mb-4 uppercase font-display tracking-tight">حماية DDoS متقدمة</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">نظام حماية داخلي وخارجي يضمن عدم توقف سيرفرك مهما بلغت قوة الهجوم.</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] group"
                  >
                    <Cpu className="text-red-600 mb-4" size={24} />
                    <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tight">NVMe Gen5</h4>
                    <p className="text-zinc-500 text-[10px] font-bold leading-relaxed">سرعة كتابة وقراءة بيانات تصل إلى 12GB/s.</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] group"
                  >
                    <Globe className="text-red-600 mb-4" size={24} />
                    <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tight">Global Network</h4>
                    <p className="text-zinc-500 text-[10px] font-bold leading-relaxed">ربط مباشر مع مزودي الخدمة لتقليل البينج.</p>
                  </motion.div>
                </div>
              </div>

              {/* Reviews Section */}
              <div id="reviews" className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 px-4">
                  <div className="text-right">
                    <span className="text-red-600 font-black text-[9px] uppercase tracking-[0.5em] mb-4 block">Testimonials</span>
                    <h3 className="text-4xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter leading-none font-display italic cyber-gradient-text">ثقة تتحدث</h3>
                    <p className="text-zinc-500 text-lg font-medium">ماذا يقول كبار أصحاب السيرفرات عن تجربة {config.siteName}.</p>
                  </div>
                  {user && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddReview(true)}
                      className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full transition-all flex items-center gap-3 shadow-2xl shadow-white/5"
                    >
                      <Plus size={18} /> أضف تقييمك
                    </motion.button>
                  )}
                </div>
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {reviews.map((review, i) => <ReviewCard key={review.id} review={review} delay={i * 0.1} />)}
                  </div>
                ) : (
                  <div className="py-32 text-center bg-zinc-950/50 border-2 border-zinc-900 border-dashed rounded-[4rem] px-8">
                    <Quote className="mx-auto text-zinc-800 mb-8 opacity-20" size={80} />
                    <p className="text-zinc-500 text-xl font-black uppercase tracking-widest">انتظر أولى كلمات المديح</p>
                  </div>
                )}
              </div>

              {/* Contact Section */}
              <div id="contact" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center mb-20 px-4">
                  <span className="text-red-600 font-black text-[9px] uppercase tracking-[0.5em] mb-4 block">Get In Touch</span>
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter font-display italic cyber-gradient-text">تواصل مباشرة</h2>
                  <p className="text-zinc-500 text-lg font-medium">فريقنا متاح للرد على استفساراتك 24 ساعة يومياً.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                  <motion.div whileHover={{ y: -8 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center group hover:bg-white/[0.05] transition-all">
                    <div className="w-14 h-14 bg-zinc-900 border border-white/5 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-6 transition-all group-hover:scale-110"><Phone size={24} /></div>
                    <h3 className="text-lg font-black text-white mb-2 uppercase font-display tracking-tight">فودافون كاش</h3>
                    <p className="text-zinc-400 text-base font-black tracking-widest font-mono text-glow">{config.vodafoneNumber}</p>
                  </motion.div>
                  {config.socialLinks?.map((link: any) => (
                    <motion.div key={link.id} whileHover={{ y: -8 }} className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center group hover:bg-white/[0.05] transition-all">
                      <div className="w-14 h-14 bg-zinc-900 border border-white/5 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-6 transition-all group-hover:scale-110">
                        {link.iconUrl ? <img src={link.iconUrl} alt="" className="w-6 h-6 object-contain" /> : <Globe size={24} />}
                      </div>
                      <h3 className="text-lg font-black text-white mb-2 uppercase font-display tracking-tight">{link.name}</h3>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-red-600 text-[8px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">Connect</a>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'products' && (
            <motion.div 
              key="products" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 md:px-8 py-20"
            >
              <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20 px-4">
                <div className="text-right">
                  <span className="text-red-600 font-black text-[10px] uppercase tracking-[0.5em] mb-4 block">Our Store</span>
                  <h2 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none font-display">استكشف خدماتنا</h2>
                  <p className="text-zinc-500 text-xl font-medium">اختر الفئة التي تناسب احتياجاتك من عالم الألعاب والبرمجة.</p>
                </div>
                <div className="flex bg-zinc-950 border border-zinc-900 p-2 rounded-2xl">
                  {['all', 'Server', 'Script', 'Service'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {cat === 'all' ? 'الكل' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {products
                  .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                  .map((p, i) => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onSelect={() => setShowPayment(p)} 
                      delay={i * 0.05} 
                    />
                  ))
                }
              </div>

              {products.filter(p => categoryFilter === 'all' || p.category === categoryFilter).length === 0 && (
                <div className="py-40 text-center bg-zinc-950/50 border-2 border-zinc-900 border-dashed rounded-[4rem] px-8">
                  <ShoppingBag className="mx-auto text-zinc-800 mb-8 opacity-20" size={80} />
                  <p className="text-zinc-500 text-xl font-black uppercase tracking-widest">لا توجد منتجات في هذا القسم حالياً</p>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-16">
              <div className="text-center space-y-4">
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">مركز المساعدة والدعم</h2>
                <p className="text-zinc-500 text-lg max-w-2xl mx-auto">نحن هنا لمساعدتك في أي وقت. افتح تذكرة جديدة وسيقوم فريقنا أو المساعد الذكي بالرد عليك.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-black/50 backdrop-blur-xl border border-zinc-800 rounded-[3rem] p-10">
                    <h3 className="text-2xl font-bold text-white mb-10 text-right flex items-center gap-3 justify-end">تذاكري الحالية <MessageSquare className="text-red-600" /></h3>
                    <div className="space-y-6">
                      {!user ? (
                        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-[2rem]">
                          <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={64} />
                          <p className="text-zinc-500 font-bold">يرجى تسجيل الدخول لمشاهدة تذاكرك</p>
                        </div>
                      ) : tickets.filter(t => t.userId === user?.uid).length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-[2rem]">
                          <MessageSquare className="mx-auto text-zinc-800 mb-6" size={64} />
                          <p className="text-zinc-500 font-bold">لا يوجد لديك تذاكر حالياً</p>
                        </div>
                      ) : (
                        tickets.filter(t => t.userId === user?.uid).map(ticket => (
                          <div key={ticket.id} className="p-8 bg-black border border-zinc-800 rounded-[2rem] hover:border-red-600/30 transition-all group shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                ticket.status === 'open' ? 'bg-red-600/10 text-red-600' : 
                                ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-500' : 
                                'bg-zinc-800 text-zinc-500'
                              }`}>
                                {ticket.status === 'open' ? 'قيد الانتظار' : ticket.status === 'replied' ? 'تم الرد' : 'مغلقة'}
                              </span>
                              <div className="text-right">
                                <h4 className="text-white font-black text-xl">تذكرة #{ticket.ticketNumber}</h4>
                                <p className="text-zinc-500 text-xs mt-1 font-mono">{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</p>
                              </div>
                            </div>
                            <div className="bg-black p-6 rounded-2xl border border-zinc-800/50 mb-8">
                              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 text-right">الموضوع: {ticket.subject}</p>
                              <p className="text-zinc-300 text-sm text-right leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                            
                            {(ticket.replies || ticket.botResponse) && (
                              <div className="space-y-4 mt-8 pt-8 border-t border-zinc-800">
                                {ticket.botResponse && (
                                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-right">
                                    <div className="flex items-center gap-2 justify-end mb-3">
                                      <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{config.botName} (مساعد ذكي)</span>
                                      <Bot size={16} className="text-blue-400" />
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.botResponse}</p>
                                  </div>
                                )}
                                {ticket.replies?.map((reply, idx) => (
                                  <div key={idx} className={`p-6 rounded-2xl text-right ${reply.isAdmin ? 'bg-red-600/5 border border-red-600/10' : 'bg-black'}`}>
                                    <div className="flex items-center gap-2 justify-end mb-3">
                                      <span className="text-xs font-black text-white">{reply.isAdmin ? 'الدعم الفني' : 'أنت'}</span>
                                      {reply.isAdmin && <ShieldCheck size={14} className="text-red-600" />}
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-red-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-red-600/30 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <h3 className="text-3xl font-black mb-4 text-right">افتح تذكرة جديدة</h3>
                    <p className="text-red-100 text-sm text-right mb-10 leading-relaxed">أخبرنا بمشكلتك وسنقوم بحلها في أسرع وقت ممكن.</p>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="عنوان المشكلة"
                        value={ticketSubject}
                        onChange={e => setTicketSubject(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-red-200 text-right outline-none focus:bg-white/20 transition-all font-bold"
                      />
                      <textarea 
                        placeholder="اشرح مشكلتك بالتفصيل..."
                        value={ticketMessage}
                        onChange={e => setTicketMessage(e.target.value)}
                        rows={5}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-red-200 text-right outline-none focus:bg-white/20 transition-all resize-none font-medium"
                      />
                      <button 
                        onClick={() => {
                          if (ticketSubject && ticketMessage) {
                            handleCreateTicket(ticketSubject, ticketMessage);
                            setTicketSubject('');
                            setTicketMessage('');
                          }
                        }}
                        className="w-full py-6 bg-white text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all shadow-xl shadow-black/10 text-lg uppercase tracking-widest"
                      >
                        إرسال التذكرة
                      </button>
                    </div>
                  </div>

                  <div className="bg-black border border-zinc-800 rounded-[3rem] p-10">
                    <h4 className="text-xl font-bold text-white mb-6 text-right">أسئلة شائعة</h4>
                    <div className="space-y-4">
                      {[
                        { q: 'كيف أقوم بالشراء؟', a: 'اختر المنتج، اضغط شراء، وقم بتحويل المبلغ.' },
                        { q: 'ما هي طرق الدفع؟', a: 'فودافون كاش واتصالات كاش حالياً.' },
                        { q: 'كيف أتواصل مع الدعم؟', a: 'عبر فتح تذكرة هنا أو عبر الديسكورد.' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2 text-right">
                          <p className="text-white font-bold text-sm">{item.q}</p>
                          <p className="text-zinc-500 text-xs leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'profile' && user && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-4 md:px-8 py-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Settings */}
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white text-right">إعدادات الحساب</h2>
                  <div className="bg-black/50 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex flex-col items-center gap-6 mb-8">
                      <div className="relative">
                        <img src={user.photoURL} alt="Avatar" className="w-32 h-32 rounded-[2rem] border-2 border-red-600 shadow-2xl shadow-red-600/20 object-cover" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center border-4 border-zinc-900">
                          <ShieldCheck size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
                        <p className="text-zinc-500 text-sm">{user.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-red-600/10 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-600/20">{user.role}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 block text-right">الاسم المستعار</label>
                        <input 
                          type="text" 
                          defaultValue={user.displayName} 
                          id="profile-name"
                          className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right focus:border-red-600 transition-all outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 block text-right">رابط صورة البروفايل</label>
                        <input 
                          type="text" 
                          defaultValue={user.photoURL} 
                          id="profile-photo"
                          className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right focus:border-red-600 transition-all outline-none" 
                        />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {profileStatus && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-4 rounded-2xl flex items-center gap-3 ${profileStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {profileStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                          <span className="text-xs font-bold">{profileStatus.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={async () => {
                        const name = (document.getElementById('profile-name') as HTMLInputElement).value;
                        const photo = (document.getElementById('profile-photo') as HTMLInputElement).value;
                        try {
                          await updateDoc(doc(db, 'users', user.uid), { displayName: name, photoURL: photo });
                          setProfileStatus({ type: 'success', message: 'تم تحديث الملف الشخصي بنجاح!' });
                          setTimeout(() => setProfileStatus(null), 3000);
                        } catch (e) { 
                          handleFirestoreError(e, OperationType.UPDATE, 'users');
                          setProfileStatus({ type: 'error', message: 'حدث خطأ أثناء التحديث' });
                        }
                      }}
                      className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20"
                    >
                      <Save size={20} /> حفظ التغييرات
                    </button>
                  </div>
                </div>

                {/* Active Services & Tickets */}
                <div className="lg:col-span-2 space-y-12">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold text-white">خدماتي النشطة</h2>
                      <div className="bg-black border border-zinc-800 px-4 py-2 rounded-xl text-xs font-bold text-zinc-500">{bookings.length} خدمة</div>
                    </div>
                    {bookings.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {bookings.map(b => (
                          <div key={b.id} className="bg-black/50 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-red-600/50 transition-all">
                            <div className="flex items-center gap-6 text-right">
                              <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Server size={32} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">{b.planName}</h3>
                                <p className="text-zinc-500 text-xs font-mono tracking-wider">{b.serverIp}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">تاريخ الانتهاء</p>
                                <p className="text-sm text-white font-bold">{new Date(b.expiryDate).toLocaleDateString('ar-EG')}</p>
                              </div>
                              <button className="px-8 py-4 bg-black text-white text-xs font-black rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all uppercase tracking-widest">إدارة</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-black/30 border border-zinc-800 border-dashed rounded-[2.5rem] p-20 text-center">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                          <LayoutDashboard className="text-zinc-800" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد خدمات نشطة</h3>
                        <p className="text-zinc-500 mb-8 max-w-xs mx-auto">ابدأ بحجز خدمتك الأولى الآن واستمتع بأفضل أداء واستقرار.</p>
                        <button onClick={() => setActiveTab('products')} className="px-10 py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">تصفح المنتجات</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold text-white">تذاكر الدعم</h2>
                      <button onClick={() => setShowCreateTicket(true)} className="p-3 bg-red-600/10 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center gap-2">
                        <Plus size={24} />
                        <span className="text-xs font-bold">فتح تذكرة جديدة</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tickets.map(t => (
                        <div key={t.id} className="p-8 bg-black/50 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] space-y-6 hover:border-red-600/50 transition-all">
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${t.status === 'open' ? 'bg-green-500/10 text-green-500' : t.status === 'pending_payment' ? 'bg-red-600/10 text-red-600' : 'bg-zinc-800 text-zinc-500'}`}>
                              {t.status === 'pending_payment' ? 'تأكيد دفع' : t.status}
                            </span>
                            <div className="text-right">
                              <h4 className="text-lg font-bold text-white">تذكرة #{t.ticketNumber}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-400 text-right line-clamp-2 leading-relaxed">{t.subject}</p>
                          {t.botResponse && (
                            <div className="p-5 bg-black/50 rounded-3xl border border-zinc-800/50">
                              <div className="flex items-center gap-2 justify-end mb-3">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{config.botName || 'مساعد الدعم'}</span>
                                <Bot size={14} className="text-red-600" />
                              </div>
                              <p className="text-xs text-zinc-500 text-right whitespace-pre-line leading-relaxed">{t.botResponse}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {tickets.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-black/20 border border-zinc-800 border-dashed rounded-[2.5rem]">
                          <MessageSquare className="mx-auto text-zinc-800 mb-4" size={32} />
                          <p className="text-zinc-600 text-sm">لا توجد تذاكر دعم حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'admin' && (['admin', 'support', 'manager', 'bot_manager'].includes(user?.role || '') || user?.email === 'moypry1@gmail.com') && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel user={user!} config={config} onUpdateConfig={handleUpdateConfig} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {activeAnnouncement && (
          <NotificationToast 
            announcement={activeAnnouncement} 
            onClose={() => setActiveAnnouncement(null)} 
          />
        )}
        {showPayment && <PaymentModal plan={showPayment} config={config} onClose={() => setShowPayment(null)} onConfirm={handleBooking} />}
        {showStaffApp && user && <StaffApplication user={user} onClose={() => setShowStaffApp(false)} />}
        {showCreateTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-black border border-zinc-800 rounded-[2.5rem] p-10 relative">
              <button onClick={() => setShowCreateTicket(false)} className="absolute top-6 left-6 p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              <h2 className="text-3xl font-black text-white mb-8 text-right">فتح تذكرة دعم</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block text-right">موضوع التذكرة</label>
                  <input 
                    type="text" 
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all"
                    placeholder="مثال: مشكلة في الدخول للسيرفر"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block text-right">وصف المشكلة</label>
                  <textarea 
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all resize-none"
                    placeholder="اشرح مشكلتك بالتفصيل..."
                  />
                </div>
                <button 
                  onClick={() => handleCreateTicket(ticketSubject, ticketMessage)}
                  className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  إرسال التذكرة
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-black border border-zinc-800 rounded-[2.5rem] p-10 relative">
              <button onClick={() => setShowAddReview(false)} className="absolute top-6 left-6 p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              <h2 className="text-3xl font-black text-white mb-8 text-right">أضف تقييمك</h2>
              <div className="space-y-6">
                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => (document.getElementById('review-rating') as HTMLInputElement).value = star.toString()}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star size={32} className="text-zinc-700 hover:text-red-600 transition-colors" />
                    </button>
                  ))}
                  <input type="hidden" id="review-rating" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 block text-right">تعليقك</label>
                  <textarea 
                    id="review-comment"
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all resize-none"
                    placeholder="اكتب تجربتك هنا..."
                  />
                </div>
                <button 
                  onClick={() => {
                    const rating = parseInt((document.getElementById('review-rating') as HTMLInputElement).value);
                    const comment = (document.getElementById('review-comment') as HTMLInputElement).value;
                    if (comment) handleAddReview({ rating, comment });
                  }}
                  className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                >
                  نشر التقييم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <footer className="bg-black/80 backdrop-blur-3xl border-t border-white/5 pt-24 pb-12 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1 space-y-8 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden group-hover:rotate-12 transition-transform duration-500">
                  {config.siteLogo ? (
                    <img src={config.siteLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Server className="text-red-600" size={24} />
                  )}
                </div>
                <span className="text-2xl font-black text-white tracking-tighter uppercase font-display">{config.siteName || 'GAMEHOST'}<span className="text-red-600">.AR</span></span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs text-center md:text-right">
                نحن نقدم الحلول التقنية الأكثر تطوراً في الشرق الأوسط. التزامنا هو التميز المطلق في كل خدمة نقدمها.
              </p>
              <div className="flex items-center gap-4">
                {config.socialLinks?.map((link: any) => (
                  <motion.a 
                    key={link.id} 
                    whileHover={{ y: -3, scale: 1.1 }}
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-600/30 transition-all shadow-xl"
                  >
                    {link.iconUrl ? <img src={link.iconUrl} alt="" className="w-5 h-5 object-contain" /> : <Globe size={20} />}
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="text-center md:text-right space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-[0.3em]">الوصول السريع</h4>
              <ul className="space-y-4">
                {['الرئيسية', 'المتجر', 'الدعم الفني', 'الأسئلة الشائعة'].map(item => (
                  <li key={item}>
                    <button onClick={() => setActiveTab(item === 'المتجر' ? 'products' : item === 'الدعم الفني' ? 'support' : 'home')} className="text-zinc-500 hover:text-red-500 text-sm font-medium transition-colors">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center md:text-right space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-[0.3em]">خدماتنا</h4>
              <ul className="space-y-4">
                {['سيرفرات FiveM', 'استضافة المواقع', 'برمجة السكربتات', 'حماية DDoS'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-zinc-500 hover:text-white text-sm font-medium transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center md:text-right space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-[0.3em]">النشرة الإخبارية</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">كن أول من يعرف عن عروضنا الحصرية والمنتجات الجديدة.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="بريدك الإلكتروني" className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600 transition-all flex-1 text-right" />
                <button className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              © 2026 {config.siteName || 'GAMEHOST'}. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-8">
              <a href="#" className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Privacy Policy</a>
              <a href="#" className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}

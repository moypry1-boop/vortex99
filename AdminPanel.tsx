import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Server, 
  MessageSquare, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert,
  Bot,
  DollarSign,
  Globe,
  Link as LinkIcon,
  Cpu,
  Database,
  HardDrive,
  ShoppingBag,
  Zap,
  Star,
  Image as ImageIcon,
  LayoutDashboard,
  Sparkles,
  Edit,
  ExternalLink,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  setDoc,
  getDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { Product, Review, StaffApplication, SupportTicket, AdminConfig, UserProfile, Booking, Announcement } from '../types';

interface AdminPanelProps {
  user: UserProfile;
  config: AdminConfig;
  onUpdateConfig: (newConfig: AdminConfig) => void;
}

export const AdminPanel = ({ user: currentUser, config, onUpdateConfig }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (currentUser.role === 'support') return 'tickets';
    if (currentUser.role === 'manager') return 'products';
    if (currentUser.role === 'bot_manager') return 'config';
    return 'dashboard';
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info' as 'info' | 'warning' | 'promotion' });
  
  // Form states
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Server',
    subCategory: '',
    name: '',
    description: '',
    price: 0,
    currency: 'EGP',
    imageUrl: '',
    purchaseLink: '',
    features: []
  });

  const [localConfig, setLocalConfig] = useState<AdminConfig>(config);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [ticketReply, setTicketReply] = useState<{ [key: string]: string }>({});
  const [appRoles, setAppRoles] = useState<{ [key: string]: UserProfile['role'] }>({});

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig(localConfig);
      setSaveStatus({ type: 'success', message: 'تم حفظ جميع الإعدادات بنجاح' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus({ type: 'error', message: 'حدث خطأ أثناء حفظ الإعدادات' });
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const isSupport = ['support', 'admin'].includes(currentUser.role) || currentUser.email === 'moypry1@gmail.com';
    const isManager = ['manager', 'admin'].includes(currentUser.role) || currentUser.email === 'moypry1@gmail.com';
    const isAdmin = currentUser.role === 'admin' || currentUser.email === 'moypry1@gmail.com';

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'products'));

    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'reviews'));

    let unsubApps = () => {};
    if (isAdmin) {
      unsubApps = onSnapshot(collection(db, 'applications'), (snap) => {
        setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffApplication)));
      }, (e) => handleFirestoreError(e, OperationType.GET, 'applications'));
    }

    let unsubTickets = () => {};
    if (isSupport) {
      unsubTickets = onSnapshot(collection(db, 'tickets'), (snap) => {
        setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
      }, (e) => handleFirestoreError(e, OperationType.GET, 'tickets'));
    }

    let unsubUsers = () => {};
    if (isSupport) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      }, (e) => handleFirestoreError(e, OperationType.GET, 'users'));
    }

    let unsubBookings = () => {};
    if (isSupport) {
      unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
      }, (e) => handleFirestoreError(e, OperationType.GET, 'bookings'));
    }

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10)), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'announcements'));

    return () => {
      unsubProducts();
      unsubReviews();
      unsubApps();
      unsubTickets();
      unsubUsers();
      unsubBookings();
      unsubAnnouncements();
    };
  }, [currentUser.role, currentUser.email]);

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        createdAt: new Date().toISOString(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName
      });
      setNewAnnouncement({ title: '', message: '', type: 'info' });
      setSaveStatus({ type: 'success', message: 'تم نشر الإعلان بنجاح وتم إرسال تنبيه للمستخدمين' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'announcements');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try { await deleteDoc(doc(db, 'announcements', id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, 'announcements'); }
  };

  const handleAddProduct = async () => {
    const price = Number(newProduct.price);
    if (!newProduct.name || isNaN(price) || !newProduct.category) {
      setSaveStatus({ type: 'error', message: 'يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، التصنيف) بشكل صحيح' });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: price,
        features: newProduct.features || [],
        createdAt: new Date().toISOString()
      });
      setNewProduct({ category: 'Server', subCategory: '', name: '', description: '', price: 0, currency: 'EGP', imageUrl: '', purchaseLink: '', features: [] });
      setSaveStatus({ type: 'success', message: 'تم إضافة المنتج بنجاح' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) { 
      setSaveStatus({ type: 'error', message: 'حدث خطأ أثناء إضافة المنتج' });
      handleFirestoreError(e, OperationType.CREATE, 'products'); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        name: selectedProduct.name,
        price: Number(selectedProduct.price),
        description: selectedProduct.description,
        features: selectedProduct.features || [],
        imageUrl: selectedProduct.imageUrl,
        purchaseLink: selectedProduct.purchaseLink,
        category: selectedProduct.category,
        subCategory: selectedProduct.subCategory
      });
      setSaveStatus({ type: 'success', message: 'تم تحديث المنتج بنجاح' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus({ type: 'error', message: 'حدث خطأ أثناء تحديث المنتج' });
      handleFirestoreError(e, OperationType.UPDATE, 'products');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try { await deleteDoc(doc(db, 'products', id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, 'products'); }
  };

  const handleDeleteReview = async (id: string) => {
    try { await deleteDoc(doc(db, 'reviews', id)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, 'reviews'); }
  };

  const handleAppAction = async (app: StaffApplication, status: 'accepted' | 'rejected', role: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'applications', app.id), { status });
      if (status === 'accepted') {
        await updateDoc(doc(db, 'users', app.userId), { role });
      }
      setSaveStatus({ type: 'success', message: `تم ${status === 'accepted' ? 'قبول' : 'رفض'} الطلب بنجاح` });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'applications'); }
  };

  const handleTicketReply = async (ticket: SupportTicket) => {
    const reply = ticketReply[ticket.id];
    if (!reply) return;
    try {
      await updateDoc(doc(db, 'tickets', ticket.id), { 
        status: 'closed',
        botResponse: reply
      });
      setTicketReply(prev => {
        const next = { ...prev };
        delete next[ticket.id];
        return next;
      });
      setSaveStatus({ type: 'success', message: 'تم الرد على التذكرة وإغلاقها' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'tickets'); }
  };

  const handleUpdateUserRole = async (uid: string, role: UserProfile['role']) => {
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser?.email === 'moypry1@gmail.com' && currentUser.email !== 'moypry1@gmail.com') {
      setSaveStatus({ type: 'error', message: 'لا يمكنك تعديل رتبة الهونر الأساسي' });
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setSaveStatus({ type: 'success', message: 'تم تحديث رتبة المستخدم بنجاح' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
  };

  const handleApprovePayment = async (ticket: SupportTicket) => {
    try {
      const botResponse = config.botMessages.paymentApproved
        .replace('{IP}', `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}:30120`)
        .replace('{PASSWORD}', Math.random().toString(36).slice(-8));
      
      await updateDoc(doc(db, 'tickets', ticket.id), { 
        status: 'closed',
        botResponse
      });

      if (ticket.status === 'pending_payment') {
        await addDoc(collection(db, 'bookings'), {
          userId: ticket.userId,
          serverId: 'manual-activation',
          game: 'Game Server',
          planName: ticket.subject,
          status: 'active',
          paymentMethod: 'Manual Verification',
          expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          createdAt: new Date().toISOString(),
          serverIp: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}:30120`
        });
      }
      setSaveStatus({ type: 'success', message: 'تم تفعيل الخدمة بنجاح' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'tickets'); }
  };

  const canAccess = (tab: string) => {
    const isSuperAdmin = currentUser.email === 'moypry1@gmail.com';
    if (isSuperAdmin || currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager' && (tab === 'products' || tab === 'dashboard')) return true;
    if (currentUser.role === 'support' && (tab === 'tickets' || tab === 'dashboard')) return true;
    if (currentUser.role === 'bot_manager' && (tab === 'config' || tab === 'dashboard')) return true;
    if (tab === 'dashboard') return true;
    return false;
  };

  const stats = [
    { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'text-blue-500' },
    { label: 'المنتجات النشطة', value: products.length, icon: ShoppingBag, color: 'text-red-600' },
    { label: 'التذاكر المفتوحة', value: tickets.filter(t => t.status !== 'closed').length, icon: MessageSquare, color: 'text-green-500' },
    { label: 'طلبات الانضمام', value: applications.filter(a => a.status === 'pending').length, icon: ShieldCheck, color: 'text-purple-500' },
    { label: 'إجمالي المبيعات', value: bookings.length, icon: DollarSign, color: 'text-yellow-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12" dir="rtl">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-3">
          <div className="bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-4 space-y-2">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-4 mb-4">نظرة عامة</p>
            <button onClick={() => setActiveTab('dashboard')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'dashboard' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
              <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'text-white' : 'text-red-600'} /> 
              <span className="font-bold text-sm">لوحة التحكم</span>
            </button>
          </div>

          <div className="bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-4 space-y-2">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-4 mb-4">القائمة الرئيسية</p>
            {canAccess('products') && (
              <button onClick={() => setActiveTab('products')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'products' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <ShoppingBag size={20} className={activeTab === 'products' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">إدارة المنتجات</span>
              </button>
            )}
            {canAccess('tickets') && (
              <button onClick={() => setActiveTab('tickets')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'tickets' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <MessageSquare size={20} className={activeTab === 'tickets' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">التذاكر والمدفوعات</span>
              </button>
            )}
            {canAccess('announcements') && (
              <button onClick={() => setActiveTab('announcements')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'announcements' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <Sparkles size={20} className={activeTab === 'announcements' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">نشر إعلان / تنبيه</span>
              </button>
            )}
            {canAccess('reviews') && (
              <button onClick={() => setActiveTab('reviews')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'reviews' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <Star size={20} className={activeTab === 'reviews' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">إدارة الآراء</span>
              </button>
            )}
          </div>

          <div className="bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-4 space-y-2">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-4 mb-4">الإدارة والنظام</p>
            {canAccess('apps') && (
              <button onClick={() => setActiveTab('apps')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'apps' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <Users size={20} className={activeTab === 'apps' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">طلبات الانضمام</span>
              </button>
            )}
            {canAccess('users') && (
              <button onClick={() => setActiveTab('users')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'users' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <ShieldCheck size={20} className={activeTab === 'users' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">إدارة الرتب</span>
              </button>
            )}
            {canAccess('config') && (
              <button onClick={() => setActiveTab('config')} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeTab === 'config' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <Settings size={20} className={activeTab === 'config' ? 'text-white' : 'text-red-600'} /> 
                <span className="font-bold text-sm">إعدادات المنصة</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 relative min-h-[600px]">
          <AnimatePresence>
            {saveStatus && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className={`absolute top-8 left-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest ${saveStatus.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              >
                {saveStatus.type === 'success' ? <Check size={20} /> : <ShieldAlert size={20} />}
                {saveStatus.message}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'announcements' && (
            <div className="space-y-8">
              <div className="text-right">
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">نشر إعلان عام</h2>
                <p className="text-zinc-500">سيظهر هذا الإعلان فوراً لجميع المستخدمين المتصلين بالموقع عبر توست تنبيه.</p>
              </div>

              <div className="bg-black/40 border border-zinc-800 rounded-[2.5rem] p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 block text-right uppercase tracking-widest">نوع التنبيه</label>
                    <select 
                      value={newAnnouncement.type} 
                      onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all"
                    >
                      <option value="info">إعلام (Info)</option>
                      <option value="warning">تحذير (Warning)</option>
                      <option value="promotion">عرض ترويجي (Promotion)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 block text-right uppercase tracking-widest">عنوان الإعلان</label>
                    <input 
                      type="text" 
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                      placeholder="مثال: خصم 50% على جميع السيرفرات"
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 block text-right uppercase tracking-widest">محتوى الإعلان</label>
                  <textarea 
                    value={newAnnouncement.message}
                    onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                    placeholder="اشرح الإعلان بالتفصيل..."
                    rows={4}
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-red-600 transition-all resize-none"
                  />
                </div>
                <button 
                  onClick={handleAddAnnouncement}
                  disabled={isSaving}
                  className="w-full py-6 bg-red-600 text-white font-black rounded-3xl hover:bg-red-700 transition-all shadow-[0_20px_40px_rgba(220,38,38,0.3)] flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  <Sparkles size={20} /> {isSaving ? 'جاري النشر...' : 'نشر وتنبيه الجميع'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white text-right mb-6 px-4">آخر الإعلانات</h3>
                {announcements.map(ann => (
                  <div key={ann.id} className="p-8 bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] flex items-center justify-between group hover:border-red-600/30 transition-all">
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-3 text-zinc-600 hover:text-red-500 transition-colors bg-black rounded-xl">
                      <Trash2 size={18} />
                    </button>
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-3 justify-end mb-2">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          ann.type === 'promotion' ? 'bg-red-600 text-white' : 
                          ann.type === 'warning' ? 'bg-yellow-500 text-black' : 
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {ann.type}
                        </span>
                        <h4 className="text-lg font-black text-white">{ann.title}</h4>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed mb-1">{ann.message}</p>
                      <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">بواسطة {ann.authorName} • {new Date(ann.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <div className="flex justify-between items-center">
                <div className="text-right">
                  <h2 className="text-4xl font-black text-white mb-2">مرحباً، {currentUser.displayName}</h2>
                  <p className="text-zinc-500">إليك نظرة سريعة على أداء المنصة اليوم.</p>
                </div>
                <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-3xl flex items-center justify-center">
                  <LayoutDashboard size={32} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="p-8 bg-black border border-zinc-800 rounded-[2rem] group hover:border-red-600/50 transition-all">
                    <div className={`w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-black border border-zinc-800 rounded-[2rem] p-8">
                  <h3 className="text-xl font-bold text-white mb-6 text-right">آخر التذاكر</h3>
                  <div className="space-y-4">
                    {tickets.slice(0, 5).map(t => (
                      <div key={t.id} className="flex justify-between items-center p-4 bg-black/50 rounded-2xl border border-zinc-800/50">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          {t.status}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">تذكرة #{t.ticketNumber}</p>
                          <p className="text-[10px] text-zinc-500">{t.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-[2rem] p-8">
                  <h3 className="text-xl font-bold text-white mb-6 text-right">أحدث المستخدمين</h3>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex justify-between items-center p-4 bg-black/50 rounded-2xl border border-zinc-800/50">
                        <span className="text-[10px] font-bold text-red-600 bg-red-600/10 px-2 py-0.5 rounded-full">{u.role}</span>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{u.displayName}</p>
                            <p className="text-[10px] text-zinc-500">{u.email}</p>
                          </div>
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'products' && canAccess('products') && (
            <div className="space-y-8">
              {!selectedProduct ? (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">إدارة المنتجات والخدمات <ShoppingBag className="text-red-600" /></h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black p-6 rounded-2xl border border-zinc-800">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">التصنيف</label>
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right">
                        <option value="Server">سيرفرات (Servers)</option>
                        <option value="Script">سكريبتات (FiveM Scripts)</option>
                        <option value="Charging">شحن ألعاب ومواقع (Charging)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">التصنيف الفرعي (اختياري)</label>
                      <input type="text" placeholder="مثال: FiveM Cars / TikTok" value={newProduct.subCategory} onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">اسم المنتج</label>
                      <input type="text" placeholder="مثال: سيرفر ماين كرافت" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">السعر</label>
                      <input type="number" placeholder="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">رابط الصورة</label>
                      <input type="text" placeholder="https://..." value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">رابط الشراء المباشر (اختياري)</label>
                      <input type="text" placeholder="https://..." value={newProduct.purchaseLink} onChange={e => setNewProduct({...newProduct, purchaseLink: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">المميزات (اضغط Enter للإضافة)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          id="feature-input"
                          placeholder="مثال: حماية DDoS" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (val) {
                                setNewProduct({...newProduct, features: [...(newProduct.features || []), val]});
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 justify-end">
                        {newProduct.features?.map((f, i) => (
                          <span key={i} className="px-3 py-1 bg-red-600/10 text-red-600 text-[10px] font-bold rounded-full border border-red-600/20 flex items-center gap-2">
                            {f}
                            <button onClick={() => setNewProduct({...newProduct, features: newProduct.features?.filter((_, idx) => idx !== i)})}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">الوصف</label>
                      <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right resize-none" rows={3} />
                    </div>
                    <button onClick={handleAddProduct} className="md:col-span-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                      <Plus size={20} /> إضافة المنتج
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedProduct(p)}
                        className="p-4 bg-black border border-zinc-800 rounded-2xl flex justify-between items-center group hover:border-red-600/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                          <div className="p-2 text-zinc-600 group-hover:text-red-600 transition-colors">
                            <Edit size={18} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white font-bold">{p.name}</p>
                            <p className="text-[10px] text-zinc-500">{p.category} {p.subCategory && `- ${p.subCategory}`}</p>
                            <p className="text-red-600 font-bold text-xs mt-1">{p.price} {p.currency}</p>
                          </div>
                          <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-bold text-sm"
                    >
                      العودة للقائمة
                    </button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      لوحة تحكم: {selectedProduct.name}
                      <ShoppingBag className="text-red-600" />
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Stats & Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-black border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl shadow-red-600/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative inline-block mb-6">
                          <img src={selectedProduct.imageUrl} alt="" className="w-40 h-40 mx-auto rounded-3xl object-cover border-2 border-red-600/20 group-hover:border-red-600 transition-all duration-500" />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:rotate-12 transition-transform">
                            <Zap className="text-white" size={20} />
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">{selectedProduct.name}</h3>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{selectedProduct.category}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black border border-zinc-800 rounded-2xl p-6 text-center group hover:border-red-600/30 transition-all">
                          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-red-600 group-hover:scale-110 transition-transform">
                            <Eye size={20} />
                          </div>
                          <p className="text-2xl font-black text-white">1,284</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">مشاهدة</p>
                        </div>
                        <div className="bg-black border border-zinc-800 rounded-2xl p-6 text-center group hover:border-red-600/30 transition-all">
                          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-red-600 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={20} />
                          </div>
                          <p className="text-2xl font-black text-red-600">156</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">مبيعات</p>
                        </div>
                      </div>

                      <div className="bg-black border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">حالة المنتج</span>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 w-[85%]" />
                        </div>
                        <p className="text-[10px] text-zinc-500 text-right">أداء المنتج: ممتاز (85%)</p>
                      </div>

                      <div className="bg-red-600/5 border border-red-600/20 rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-black text-red-600 uppercase tracking-widest text-right">إجراءات سريعة</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <button className="w-full py-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-800 hover:border-red-600/30">
                            <ExternalLink size={14} /> معاينة في الموقع
                          </button>
                          <button className="w-full py-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-800 hover:border-red-600/30">
                            <ImageIcon size={14} /> تغيير الصورة
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-3xl p-8 md:p-10 shadow-2xl shadow-red-600/5">
                      <div className="flex items-center gap-3 mb-8 justify-end">
                        <h3 className="text-xl font-black text-white">تعديل بيانات المنتج</h3>
                        <div className="w-8 h-8 bg-red-600/10 text-red-600 rounded-lg flex items-center justify-center">
                          <Edit size={16} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 block text-right">اسم المنتج</label>
                          <input 
                            type="text" 
                            value={selectedProduct.name} 
                            onChange={e => setSelectedProduct({...selectedProduct, name: e.target.value})} 
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 block text-right">السعر</label>
                          <input 
                            type="number" 
                            value={selectedProduct.price} 
                            onChange={e => setSelectedProduct({...selectedProduct, price: Number(e.target.value)})} 
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-zinc-500 block text-right">الوصف</label>
                          <textarea 
                            value={selectedProduct.description} 
                            onChange={e => setSelectedProduct({...selectedProduct, description: e.target.value})} 
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right resize-none" 
                            rows={4} 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-zinc-500 block text-right">المميزات</label>
                          <div className="flex flex-wrap gap-2 justify-end mb-2">
                            {(selectedProduct.features || []).map((f, i) => (
                              <span key={i} className="px-3 py-1 bg-red-600/10 text-red-600 text-[10px] font-bold rounded-full border border-red-600/20 flex items-center gap-2">
                                {f}
                                <button onClick={() => setSelectedProduct({...selectedProduct, features: (selectedProduct.features || []).filter((_, idx) => idx !== i)})}><X size={10} /></button>
                              </span>
                            ))}
                          </div>
                          <input 
                            type="text" 
                            placeholder="أضف ميزة جديدة..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  setSelectedProduct({...selectedProduct, features: [...(selectedProduct.features || []), val]});
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex gap-4">
                        <button 
                          onClick={handleUpdateProduct}
                          disabled={isSaving}
                          className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                        >
                          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                              handleDeleteProduct(selectedProduct.id);
                              setSelectedProduct(null);
                            }
                          }}
                          className="px-8 py-4 bg-zinc-800 text-red-500 font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && canAccess('reviews') && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">إدارة آراء العملاء <Star className="text-red-600" /></h2>
              <div className="grid grid-cols-1 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="p-6 bg-black border border-zinc-800 rounded-2xl flex justify-between items-start">
                    <button onClick={() => handleDeleteReview(r.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"><Trash2 size={18} /></button>
                    <div className="text-right flex-1">
                      <div className="flex items-center gap-3 justify-end mb-2">
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{r.userName}</p>
                          <div className="flex gap-0.5 justify-end">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={i < r.rating ? 'fill-red-600 text-red-600' : 'text-zinc-700'} />
                            ))}
                          </div>
                        </div>
                        <img src={r.userPhoto} alt="" className="w-10 h-10 rounded-full border border-zinc-800" />
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">إدارة التذاكر والمدفوعات <MessageSquare className="text-red-600" /></h2>
              <div className="space-y-4">
                {tickets.filter(t => t.status !== 'closed').map(t => (
                  <div key={t.id} className="p-6 bg-black border border-zinc-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        {t.status === 'pending_payment' && (
                          <button onClick={() => handleApprovePayment(t)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-all flex items-center gap-2">
                            <Check size={14} /> تأكيد وتفعيل
                          </button>
                        )}
                        <button onClick={() => updateDoc(doc(db, 'tickets', t.id), { status: 'closed' })} className="px-4 py-2 bg-zinc-800 text-white text-xs font-bold rounded-lg hover:bg-zinc-700 transition-all">إغلاق بدون رد</button>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'pending_payment' ? 'bg-red-600/10 text-red-600' : 'bg-blue-500/10 text-blue-500'}`}>
                            {t.status === 'pending_payment' ? 'تأكيد دفع' : 'دعم فني'}
                          </span>
                          <h3 className="text-lg font-bold text-white">تذكرة #{t.ticketNumber}</h3>
                        </div>
                        <p className="text-zinc-500 text-xs">{t.subject}</p>
                      </div>
                    </div>
                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/50">
                      <p className="text-zinc-400 text-sm text-right leading-relaxed">{t.message}</p>
                    </div>
                    {t.screenshotUrl && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-zinc-500 mb-2 text-right">المرفقات:</p>
                        <img src={t.screenshotUrl} alt="Attachment" className="max-w-xs rounded-xl border border-zinc-800" />
                      </div>
                    )}
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 block text-right">الرد على التذكرة</label>
                      <textarea 
                        value={ticketReply[t.id] || ''}
                        onChange={e => setTicketReply({ ...ticketReply, [t.id]: e.target.value })}
                        placeholder="اكتب ردك هنا..."
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-right text-sm resize-none"
                        rows={3}
                      />
                      <button 
                        onClick={() => handleTicketReply(t)}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        إرسال الرد وإغلاق التذكرة
                      </button>
                    </div>
                  </div>
                ))}
                {tickets.filter(t => t.status !== 'closed').length === 0 && (
                  <div className="py-20 text-center bg-black border border-zinc-800 border-dashed rounded-[2.5rem]">
                    <MessageSquare className="mx-auto text-zinc-800 mb-4" size={48} />
                    <p className="text-zinc-600">لا توجد تذاكر مفتوحة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <div className="text-right">
                  <h2 className="text-3xl font-black text-white mb-2">طلبات الانضمام</h2>
                  <p className="text-zinc-500">مراجعة طلبات الانضمام لفريق العمل وتحديد الرتب.</p>
                </div>
                <div className="w-14 h-14 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center">
                  <Users size={28} />
                </div>
              </div>

              <div className="space-y-4">
                {applications.filter(app => app.status === 'pending').map(app => (
                  <div key={app.id} className="p-8 bg-black border border-zinc-800 rounded-3xl flex flex-col gap-6 hover:border-zinc-700 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex flex-wrap gap-3 items-center">
                        <select 
                          value={appRoles[app.id] || 'support'}
                          onChange={(e) => setAppRoles({ ...appRoles, [app.id]: e.target.value as UserProfile['role'] })}
                          className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:border-red-600 transition-all outline-none"
                        >
                          <option value="support">دعم فني</option>
                          <option value="manager">مدير منتجات</option>
                          <option value="bot_manager">مدير البوت</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button 
                          onClick={() => handleAppAction(app, 'accepted', appRoles[app.id] || 'support')} 
                          className="px-6 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-all flex items-center gap-2"
                        >
                          <Check size={18} /> قبول وتعيين
                        </button>
                        <button 
                          onClick={() => handleAppAction(app, 'rejected', 'user')} 
                          className="px-6 py-2 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                        >
                          <X size={18} /> رفض
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white mb-1">{app.name}</p>
                        <p className="text-zinc-500 text-xs font-mono">{new Date(app.createdAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="bg-black/50 p-6 rounded-2xl border border-zinc-800/50">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 text-right">الخبرة والرسالة:</p>
                      <p className="text-zinc-300 text-sm text-right leading-relaxed whitespace-pre-line">{app.experience}</p>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.status === 'pending').length === 0 && (
                  <div className="py-24 text-center bg-black/50 border border-zinc-800 border-dashed rounded-[3rem]">
                    <Users className="mx-auto text-zinc-800 mb-6" size={64} />
                    <p className="text-zinc-500 font-bold">لا توجد طلبات انضمام معلقة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">إدارة رتب المستخدمين <ShieldCheck className="text-red-600" /></h2>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.uid} className="p-4 bg-black border border-zinc-800 rounded-xl flex justify-between items-center">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as any)}
                      className="bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white disabled:opacity-50"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="support">دعم فني</option>
                      <option value="manager">مدير منتجات</option>
                      <option value="bot_manager">مدير البوت</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{user.displayName}</p>
                        <p className="text-zinc-500 text-[10px]">{user.email}</p>
                      </div>
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">إعدادات الموقع والهوية <Globe className="text-red-600" /></h2>
              
              <div className="space-y-8">
                {/* Site Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black p-6 rounded-2xl border border-zinc-800">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 block text-right">اسم الموقع</label>
                    <input type="text" value={localConfig.siteName} onChange={e => setLocalConfig({...localConfig, siteName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 block text-right">رابط شعار الموقع (Logo URL)</label>
                    <input type="text" value={localConfig.siteLogo} onChange={e => setLocalConfig({...localConfig, siteLogo: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 block text-right">كلمة سر الموقع (اختياري)</label>
                    <input type="text" value={localConfig.sitePassword || ''} onChange={e => setLocalConfig({...localConfig, sitePassword: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                  </div>
                </div>

                {/* Payment Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black p-6 rounded-2xl border border-zinc-800">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 block text-right">رقم فودافون كاش</label>
                    <input type="text" value={localConfig.vodafoneNumber} onChange={e => setLocalConfig({...localConfig, vodafoneNumber: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 block text-right">رقم اتصالات كاش</label>
                    <input type="text" value={localConfig.etisalatNumber} onChange={e => setLocalConfig({...localConfig, etisalatNumber: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4 bg-black p-6 rounded-2xl border border-zinc-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-end">روابط التواصل الاجتماعي <LinkIcon size={20} className="text-red-600" /></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(localConfig.socialLinks || []).map((link, index) => (
                      <div key={link.id} className="p-4 bg-black border border-zinc-800 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <button onClick={() => {
                            const newLinks = localConfig.socialLinks.filter((_, i) => i !== index);
                            setLocalConfig({...localConfig, socialLinks: newLinks});
                          }} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"><Trash2 size={16} /></button>
                          <input 
                            type="text" 
                            value={link.name} 
                            onChange={e => {
                              const newLinks = [...localConfig.socialLinks];
                              newLinks[index].name = e.target.value;
                              setLocalConfig({...localConfig, socialLinks: newLinks});
                            }}
                            placeholder="اسم المنصة (مثال: ديسكورد)"
                            className="bg-transparent border-none text-white text-right font-bold focus:ring-0 p-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            value={link.url} 
                            onChange={e => {
                              const newLinks = [...localConfig.socialLinks];
                              newLinks[index].url = e.target.value;
                              setLocalConfig({...localConfig, socialLinks: newLinks});
                            }}
                            placeholder="رابط المنصة"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white text-right"
                          />
                          <input 
                            type="text" 
                            value={link.iconUrl} 
                            onChange={e => {
                              const newLinks = [...localConfig.socialLinks];
                              newLinks[index].iconUrl = e.target.value;
                              setLocalConfig({...localConfig, socialLinks: newLinks});
                            }}
                            placeholder="رابط أيقونة المنصة"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white text-right"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newLink = { id: Math.random().toString(36).slice(2), name: 'منصة جديدة', url: '', iconUrl: '' };
                        setLocalConfig({...localConfig, socialLinks: [...localConfig.socialLinks, newLink]});
                      }}
                      className="p-4 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
                    >
                      <Plus size={20} /> إضافة منصة تواصل
                    </button>
                  </div>
                </div>

                {/* Bot Settings */}
                <div className="space-y-4 bg-black p-6 rounded-2xl border border-zinc-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-end">إعدادات البوت <Bot size={20} className="text-red-600" /></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">اسم البوت</label>
                      <input 
                        type="text" 
                        value={localConfig.botName} 
                        onChange={e => setLocalConfig({...localConfig, botName: e.target.value})} 
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 block text-right">التذاكر التي يرد عليها البوت (اضغط Enter للإضافة)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: تأكيد دفع"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val && !(localConfig.botEnabledSubjects || []).includes(val)) {
                              setLocalConfig({...localConfig, botEnabledSubjects: [...(localConfig.botEnabledSubjects || []), val]});
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-right" 
                      />
                      <div className="flex flex-wrap gap-2 mt-2 justify-end">
                        {(localConfig.botEnabledSubjects || []).map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-red-600/10 text-red-600 text-[10px] font-bold rounded-full border border-red-600/20 flex items-center gap-2">
                            {s}
                            <button onClick={() => setLocalConfig({...localConfig, botEnabledSubjects: (localConfig.botEnabledSubjects || []).filter((_, idx) => idx !== i)})}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 text-right">رسالة تأكيد الدفع (تلقائية)</label>
                      <textarea 
                        value={localConfig.botMessages?.paymentApproved || ''} 
                        onChange={e => setLocalConfig({
                          ...localConfig, 
                          botMessages: {
                            welcomeMessage: localConfig.botMessages?.welcomeMessage || '',
                            paymentApproved: e.target.value
                          }
                        })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-right resize-none"
                        rows={4}
                      />
                      <p className="text-[10px] text-zinc-600 mt-2 text-right">استخدم {'{IP}'} و {'{PASSWORD}'} ليتم استبدالهم تلقائياً.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 text-right">رسالة الترحيب</label>
                      <textarea 
                        value={localConfig.botMessages?.welcomeMessage || ''} 
                        onChange={e => setLocalConfig({
                          ...localConfig, 
                          botMessages: {
                            paymentApproved: localConfig.botMessages?.paymentApproved || '',
                            welcomeMessage: e.target.value
                          }
                        })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-right resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full py-5 bg-red-600 text-white font-black rounded-3xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={24} />
                  )}
                  {isSaving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

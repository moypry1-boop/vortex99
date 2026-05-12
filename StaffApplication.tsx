import React, { useState } from 'react';
import { Send, ShieldCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface StaffApplicationProps {
  user: UserProfile;
  onClose: () => void;
}

export const StaffApplication = ({ user, onClose }: StaffApplicationProps) => {
  const [name, setName] = useState(user.displayName || '');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        name,
        experience,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'applications');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-black border border-zinc-800 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تم إرسال طلبك!</h2>
          <p className="text-zinc-500 mb-8">سنقوم بمراجعة طلبك والرد عليك في أقرب وقت ممكن.</p>
          <button onClick={onClose} className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all">إغلاق</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative w-full max-w-xl bg-black border border-zinc-800 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-red-600/10"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X size={28} /></button>
        
        <div className="text-right mb-10">
          <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 ml-auto">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">انضم لفريق الإدارة</h2>
          <p className="text-zinc-500 leading-relaxed">نحن نبحث دائماً عن المبدعين والمجتهدين. قدم طلبك الآن وسنقوم بمراجعته بعناية.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-600 uppercase tracking-widest block text-right">الاسم بالكامل</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right focus:border-red-600 transition-all outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-600 uppercase tracking-widest block text-right">البريد الإلكتروني</label>
              <input 
                type="email" 
                disabled
                value={user.email}
                className="w-full bg-black/50 border border-zinc-800/50 rounded-2xl px-6 py-4 text-zinc-500 text-right cursor-not-allowed" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-600 uppercase tracking-widest block text-right">لماذا تريد الانضمام؟ وما هي خبرتك السابقة؟</label>
            <textarea 
              required
              value={experience}
              onChange={e => setExperience(e.target.value)}
              rows={5}
              placeholder="اكتب هنا بالتفصيل عن مهاراتك وما يمكنك تقديمه للمنصة..."
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white text-right focus:border-red-600 transition-all outline-none resize-none" 
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-red-600/20 text-lg uppercase tracking-widest"
          >
            {loading ? 'جاري معالجة طلبك...' : <><Send size={20} /> إرسال طلب الانضمام</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

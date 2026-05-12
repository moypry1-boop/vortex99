import React, { useState } from 'react';
import { X, Upload, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, AdminConfig } from '../types';

interface PaymentModalProps {
  plan: Product;
  config: AdminConfig;
  onClose: () => void;
  onConfirm: (data: { method: string; screenshot: string; message: string }) => void;
}

export const PaymentModal = ({ plan, config, onClose, onConfirm }: PaymentModalProps) => {
  const [method, setMethod] = useState('Vodafone Cash');
  const [screenshot, setScreenshot] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-right">إتمام الحجز</h2>
        <p className="text-zinc-500 text-sm mb-8 text-right">يرجى تحويل المبلغ الموضح أدناه ثم إرفاق صورة التحويل.</p>
        
        <div className="bg-black rounded-2xl p-6 mb-8 border border-zinc-800 text-right">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-bold">{plan.price} {plan.currency || 'EGP'}</span>
            <span className="text-zinc-500 text-sm">المبلغ المطلوب</span>
          </div>
          <div className="h-px bg-zinc-800 mb-4" />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-red-600 font-mono font-bold">{config.vodafoneNumber}</span>
              <span className="text-zinc-500 text-xs">رقم فودافون كاش</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-500 font-mono font-bold">{config.etisalatNumber}</span>
              <span className="text-zinc-500 text-xs">رقم اتصالات كاش</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 mb-8">
          <div>
            <p className="text-sm font-bold text-white text-right mb-4">اختر وسيلة التحويل</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMethod('Vodafone Cash')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${method === 'Vodafone Cash' ? 'bg-red-600/10 border-red-600 text-red-600' : 'bg-black border-zinc-800 text-zinc-500'}`}
              >
                <Phone size={24} />
                <span className="text-xs font-bold">فودافون كاش</span>
              </button>
              <button 
                onClick={() => setMethod('Etisalat Cash')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${method === 'Etisalat Cash' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-black border-zinc-800 text-zinc-500'}`}
              >
                <Phone size={24} />
                <span className="text-xs font-bold">اتصالات كاش</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 text-right">إرفاق سكرين شوت التحويل</label>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${screenshot ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 bg-black group-hover:border-zinc-700'}`}>
                {screenshot ? (
                  <img src={screenshot} alt="Preview" className="h-full w-full object-contain p-2" />
                ) : (
                  <>
                    <Upload className="text-zinc-600" size={32} />
                    <span className="text-xs text-zinc-600">اضغط لرفع الصورة</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 text-right">رسالة إضافية (اختياري)</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثلاً: تم التحويل من رقم 010..."
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 text-right resize-none"
              rows={2}
            />
          </div>
        </div>
        
        <button 
          onClick={() => onConfirm({ method, screenshot, message })}
          disabled={!screenshot}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          فتح تذكرة تأكيد الدفع
        </button>
      </motion.div>
    </div>
  );
};

// client/src/components/workflow/AddEngineerModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, User } from 'lucide-react';

export default function AddEngineerModal({ isOpen, onClose, onConfirm, saving }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!name.trim()) newErrors.name = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (validate()) {
      onConfirm({ email: email.trim(), full_name: name.trim() });
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Engineer</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Create a new engineer profile in the system</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirm} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({...errors, name: ''}); }}
                    placeholder="e.g. Joshua Miller"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.name ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-500 font-bold pl-1 uppercase tracking-tighter">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({...errors, email: ''}); }}
                    placeholder="e.g. joshua@caldim.com"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${errors.email ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold pl-1 uppercase tracking-tighter">{errors.email}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Creating Profile...' : 'Register Engineer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


// client/src/components/workflow/PushBackModal.jsx
// Admin modal requiring a mandatory comment before pushing back to IN PROGRESS

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MessageSquare } from 'lucide-react';

export default function PushBackModal({ isOpen, onClose, onConfirm, projectName, saving }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('A revision comment is required.');
      return;
    }
    setError('');
    onConfirm(comment.trim());
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Push Back for Revision</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{projectName}</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  The status will revert to <strong>IN PROGRESS</strong> and the estimator will be notified with your comment. This loop can repeat any number of times.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  Revision Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setError(''); }}
                  placeholder='e.g. "Incorrect stringer size for stair 2, please revise the wall-side connection."'
                  rows={4}
                  className={`w-full p-3 text-sm border rounded-xl resize-none outline-none transition-all font-medium text-slate-800 
                    ${error ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)]'}`}
                />
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-50">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !comment.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-amber-100"
              >
                <AlertTriangle size={15} />
                {saving ? 'Sending...' : 'Push Back with Comment'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


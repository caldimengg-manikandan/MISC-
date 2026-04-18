// client/src/components/workflow/SendForReviewModal.jsx
// Estimator modal to select a specific Admin reviewer when completing the IN PROGRESS stage

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserCheck, ChevronDown } from 'lucide-react';
import API_BASE_URL from '../../config/api';

export default function SendForReviewModal({ isOpen, onClose, onConfirm, project, saving }) {
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const token = localStorage.getItem('steel_token');
      fetch(`${API_BASE_URL}/api/projects/users/reviewers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setReviewers(data.users);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedReviewer) {
      setError('Please select a reviewer');
      return;
    }
    setError('');
    const reviewerObj = reviewers.find(r => r.id.toString() === selectedReviewer);
    onConfirm({ reviewer_id: selectedReviewer, reviewer_email: reviewerObj?.email, notes });
  };

  const handleClose = () => {
    setSelectedReviewer('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-purple-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Send size={18} className="text-purple-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Send for Review</h2>
                  <p className="text-xs text-purple-200 mt-0.5">{project?.projectName}</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-purple-200 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Reviewer Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck size={11} />
                  Select Reviewer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedReviewer}
                    onChange={(e) => { setSelectedReviewer(e.target.value); setError(''); }}
                    disabled={loading || reviewers.length === 0}
                    className={`w-full pl-3 pr-10 py-2.5 text-sm border rounded-xl outline-none transition-all appearance-none
                      ${error ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)]'}
                      ${loading ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-800'}`}
                  >
                    <option value="">{loading ? 'Loading reviewers...' : 'Select an admin...'}</option>
                    {reviewers.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.full_name} ({r.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                <p className="text-[10px] text-slate-400 mt-1 pl-1">Only admin-role users in your company are shown.</p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notes for reviewer (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any context or specific areas to double-check..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all resize-none focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-50">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !selectedReviewer}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-purple-200"
              >
                <Send size={15} />
                {saving ? 'Sending...' : 'Send for Review'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

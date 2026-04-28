// client/src/components/workflow/SendToClientModal.jsx
// Admin modal for sending the report to the client with optional CC, message, attachment type

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, FileText, FileSpreadsheet, Files } from 'lucide-react';

export default function SendToClientModal({ isOpen, onClose, onConfirm, project, saving }) {
  const defaultEmail = project?.CustomerEmail || project?.customer_email || '';
  const [clientEmail, setClientEmail] = useState(defaultEmail);
  const [cc, setCc] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [attachmentType, setAttachmentType] = useState('PDF');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setError('A valid client email address is required.');
      return;
    }
    setError('');
    onConfirm({ clientEmail: clientEmail.trim(), cc: cc.trim(), customMessage: customMessage.trim(), attachmentType });
  };

  const handleClose = () => {
    setClientEmail(defaultEmail);
    setCc('');
    setCustomMessage('');
    setAttachmentType('PDF');
    setError('');
    onClose();
  };

  const ATTACHMENT_OPTS = [
    { value: 'PDF', label: 'PDF Report', icon: FileText },
    { value: 'BOM', label: 'Excel BOM', icon: FileSpreadsheet },
    { value: 'Both', label: 'PDF + BOM', icon: Files },
  ];

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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Send size={18} className="text-[#10a37f]" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Send Report to Client</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{project?.projectName}</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Client Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={11} />
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => { setClientEmail(e.target.value); setError(''); }}
                  placeholder="client@company.com"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all font-mono
                    ${error ? 'border-red-300' : 'border-slate-200 focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)]'}`}
                />
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              </div>

              {/* CC */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CC (Optional)</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@company.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition-all font-mono focus:border-[--gpt-accent] focus:ring-4 focus:ring-[rgba(16,163,127,0.08)]"
                />
              </div>

              {/* Attachment Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attachment</label>
                <div className="grid grid-cols-3 gap-2">
                  {ATTACHMENT_OPTS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAttachmentType(value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all
                        ${attachmentType === value
                          ? 'border-[--gpt-accent] bg-[rgba(16,163,127,0.06)] text-[#10a37f]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Message (Optional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal note to include in the email..."
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
                disabled={saving || !clientEmail.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-slate-200"
              >
                <Send size={15} />
                {saving ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


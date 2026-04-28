// client/src/components/notifications/NotificationBell.jsx
// In-app notification bell icon with unread count badge.
// Shows a dropdown of the last 50 notifications. Polls every 30s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, FolderOpen, Trash2, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const TYPE_COLORS = {
  project_created:      'bg-blue-50 text-blue-600',
  engineer_assigned:    'bg-blue-50 text-blue-600',
  project_started:      'bg-amber-50 text-amber-600',
  sent_for_review:      'bg-purple-50 text-purple-600',
  pushed_back:          'bg-amber-50 text-amber-700',
  approved:             'bg-emerald-50 text-emerald-600',
  report_sent:          'bg-slate-50 text-slate-600',
  report_sent_confirm:  'bg-emerald-50 text-emerald-600',
  deadline_warning:     'bg-orange-50 text-orange-600',
  deadline_urgent:      'bg-red-50 text-red-600',
  deadline_warning_admin: 'bg-orange-50 text-orange-600',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('steel_token');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, [token]);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmClear(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, { credentials: 'include',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/mark-all-read`, { credentials: 'include',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications/clear`, { credentials: 'include',
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        setConfirmClear(false);
      }
    } catch {}
    setLoading(false);
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.project_id) navigate('/estimations');
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 z-50 overflow-hidden"
          >
            {/* Header / Dynamic confirmation area */}
            <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-white">
              {!confirmClear ? (
                <>
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-slate-700" />
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <>
                        <button
                          onClick={() => setConfirmClear(true)}
                          disabled={loading}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Clear all"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={markAllRead}
                          disabled={loading}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                          title="Mark all read"
                        >
                          <CheckCheck size={14} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-all">
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full animate-in slide-in-from-right-2 duration-200">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={14} />
                    <span className="text-xs font-bold">Clear all history?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={clearAll}
                      disabled={loading}
                      className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-colors"
                    >
                      CLEAR
                    </button>
                    <button 
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      NO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification List */}
            <div className={`overflow-y-auto max-h-[420px] transition-all ${confirmClear ? 'opacity-40 grayscale' : ''}`}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Bell size={28} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1">You'll be notified on project updates</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${!notif.is_read ? 'bg-blue-50/10' : ''}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[notif.type] || 'bg-slate-50 text-slate-500'}`}>
                      <FolderOpen size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug font-medium ${notif.is_read ? 'text-slate-500' : 'text-slate-900'}`}>
                        {notif.message}
                      </p>
                      {notif.projectName && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{notif.projectName}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && !confirmClear && (
              <div className="p-3 border-t border-slate-50 text-center bg-slate-50/20">
                <p className="text-[10px] text-slate-400">Showing last 50 notifications</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Paintbrush, User, Settings, LifeBuoy, LogOut, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileContextMenu({ user, handleLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setIsOpen(false);
    
    if (action === 'logout') {
      handleLogout();
    } else {
      toast('🚧 This feature is coming soon!', { icon: '⚒️' });
    }
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const userName = user?.name || user?.email || 'User';

  return (
    <div className="sidebar-footer" ref={menuRef} onClick={toggleMenu} style={{ position: 'relative', cursor: 'pointer' }}>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="profile-menu-dropdown"
          >
            {/* Context Anchor Header (matches screenshot behavior) */}
            <div className="profile-menu-header">
              <div className="sidebar-footer-avatar" style={{ transform: 'scale(0.8)', marginLeft: '-4px' }}>{userInitials}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500, color: 'var(--gpt-sidebar-text)' }}>{userName}</span>
                <span style={{ fontSize: '11px', color: 'var(--gpt-sidebar-muted)' }}>{user?.email || '@user'}</span>
              </div>
            </div>

            <div className="context-menu-divider" />

            <button className="context-menu-option" onClick={(e) => handleAction(e, 'org')}>
              <Building size={14} /> Organization Defaults
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'personalize')}>
              <Paintbrush size={14} /> Personalization
            </button>
            
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'profile')}>
              <User size={14} /> Profile
            </button>
            <button className="context-menu-option" onClick={(e) => handleAction(e, 'settings')}>
              <Settings size={14} /> System Settings
            </button>
            
            <div className="context-menu-divider" />

            <button className="context-menu-option" onClick={(e) => handleAction(e, 'support')}>
              <LifeBuoy size={14} /> Support &amp; Templates
            </button>
            <button className="context-menu-option context-menu-destructive" onClick={(e) => handleAction(e, 'logout')}>
              <LogOut size={14} /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sidebar-footer-avatar">{userInitials}</div>
      <div className="sidebar-footer-info">
        <div className="user-name">{userName}</div>
        <div className="user-role">{user?.role || 'Engineer'}</div>
      </div>
      <MoreHorizontal size={15} style={{ color: 'var(--gpt-sidebar-muted)', flexShrink: 0 }} />

    </div>
  );
}

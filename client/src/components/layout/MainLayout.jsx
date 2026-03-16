import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderOpen, ClipboardCheck, ArrowUpDown, BarChart3, Settings, 
  LogOut, ChevronRight, HelpCircle, Save, Share2, Menu, X,
  LayoutDashboard, Database, Box, DollarSign, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  {
    id: 'project-info',
    label: 'Project Info',
    icon: <ClipboardCheck size={18} />,
    path: '/project-info',
  },
  {
    id: 'estimate',
    label: 'Estimate',
    icon: <ArrowUpDown size={18} />,
    path: null,
    children: [
      { id: 'stair-railings', label: 'Stair & Railings', icon: <Box size={14} />, path: '/estimate/stair-railings' },
      { id: 'railings',       label: 'Railings',         icon: <Database size={14} />, path: '/estimate/railings' },
      { id: 'ladders',        label: 'Ladders',           icon: <ArrowUpDown size={14} />, path: '/estimate/ladders' },
      { id: 'bollards',       label: 'Bollards',          icon: <Box size={14} />, path: '/estimate/bollards' },
      { id: 'gates',          label: 'Gates',             icon: <Box size={14} />, path: '/estimate/gates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 size={18} />,
    path: '/reports',
  },
];

const SubMenu = ({ items, activePath, onNavigate }) => (
  <motion.div 
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="sidebar-submenu"
    style={{ overflow: 'hidden' }}
  >
    {items.map(item => (
      <div
        key={item.path}
        className={`sidebar-item sidebar-sub-item ${activePath === item.path ? 'active' : ''}`}
        onClick={() => onNavigate(item.path)}
      >
        <span className="sidebar-item-icon">
          {item.icon}
        </span>
        {item.label}
      </div>
    ))}
  </motion.div>
);

// ── Main Layout ─────────────────────────────────────────────────────────────
export default function MainLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const [estimateOpen, setEstimateOpen] = useState(
    location.pathname.startsWith('/estimate')
  );

  const activePath = location.pathname;

  const isEstimateActive = location.pathname.startsWith('/estimate');

  // Breadcrumb
  const crumbs = buildCrumbs(activePath);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">SteelSpec</span>
            <span className="sidebar-logo-sub">Engineering</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>

          {NAV.map(item => {
            if (item.children) {
              const isActive = item.children.some(c => activePath === c.path);
              return (
                <div key={item.id}>
                  <div
                    className={`sidebar-item has-children ${isActive ? 'active' : ''}`}
                    onClick={() => setEstimateOpen(o => !o)}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <ChevronRight 
                      size={16} 
                      className={`sidebar-expand-icon ${estimateOpen ? 'open' : ''}`}
                      style={{ transition: 'transform 0.2s' }}
                    />
                  </div>
                  <AnimatePresence>
                    {estimateOpen && (
                      <SubMenu
                        items={item.children}
                        activePath={activePath}
                        onNavigate={navigate}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`sidebar-item ${activePath === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {item.label}
              </div>
            );
          })}

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <div
              className="sidebar-item"
              onClick={handleLogout}
              style={{ color: '#fb7185' }}
            >
              <span className="sidebar-item-icon"><LogOut size={18} /></span>
              Sign Out
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-avatar">{userInitials}</div>
          <div className="sidebar-footer-info">
            <div className="user-name">{user?.name || user?.email || 'User'}</div>
            <div className="user-role">{user?.role || 'Engineer'}</div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Header */}
        <header className="top-header">
          <nav className="header-breadcrumb">
            <span className="header-breadcrumb-item">SteelSpec</span>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span className="header-breadcrumb-sep">›</span>
                <span className={`header-breadcrumb-item ${i === crumbs.length - 1 ? 'current' : ''}`}>
                  {c}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="header-actions">
            <button className="header-btn header-btn-outline">
              <HelpCircle size={16} /> Help
            </button>
            <button className="header-btn header-btn-outline">
              <Share2 size={16} /> Export
            </button>
            <button className="header-btn header-btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </header>

        {/* Page Workspace */}
        <main className="workspace">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
function buildCrumbs(path) {
  const map = {
    '/project-info':           ['Project Info'],
    '/estimate/stair-railings':['Estimate', 'Stair & Railings'],
    '/estimate/railings':      ['Estimate', 'Railings'],
    '/estimate/ladders':       ['Estimate', 'Ladders'],
    '/estimate/bollards':      ['Estimate', 'Bollards'],
    '/estimate/gates':         ['Estimate', 'Gates'],
    '/reports':                ['Reports'],
  };
  return map[path] || ['Dashboard'];
}

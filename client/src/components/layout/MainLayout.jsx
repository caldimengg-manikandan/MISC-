// src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ name }) => {
  const icons = {
    folder: '📁', estimate: '📐', stair: '🪜', railing: '🔩', ladder: '⚙️',
    bollard: '🔳', gate: '🚪', reports: '📊', settings: '⚙️', logout: '→',
    chevron: '›', save: '💾', export: '📤', add: '+', help: '?',
  };
  return <span style={{ fontSize: '14px' }}>{icons[name] || '•'}</span>;
};

// ── Collapsible Sub-Menu ────────────────────────────────────────────────────
const SubMenu = ({ items, activePath, onNavigate }) => (
  <div>
    {items.map(item => (
      <div
        key={item.path}
        className={`sidebar-item sidebar-sub-item ${activePath === item.path ? 'active' : ''}`}
        onClick={() => onNavigate(item.path)}
        id={`nav-${item.id}`}
      >
        <span className="sidebar-item-icon" style={{ fontSize: '12px' }}>
          {item.icon}
        </span>
        {item.label}
      </div>
    ))}
  </div>
);

// ── Nav Config ──────────────────────────────────────────────────────────────
const NAV = [
  {
    id: 'project-info',
    label: 'Project Info',
    icon: '📋',
    path: '/project-info',
  },
  {
    id: 'estimate',
    label: 'Estimate',
    icon: '📐',
    path: null,
    children: [
      { id: 'stair-railings', label: 'Stair & Railings', icon: '🪜', path: '/estimate/stair-railings' },
      { id: 'railings',       label: 'Railings',         icon: '🔧', path: '/estimate/railings' },
      { id: 'ladders',        label: 'Ladders',           icon: '⬆', path: '/estimate/ladders' },
      { id: 'bollards',       label: 'Bollards',          icon: '🔳', path: '/estimate/bollards' },
      { id: 'gates',          label: 'Gates',             icon: '🚪', path: '/estimate/gates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📊',
    path: '/reports',
  },
];

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
              return (
                <div key={item.id}>
                  <div
                    className={`sidebar-item has-children ${isEstimateActive ? 'active' : ''}`}
                    onClick={() => setEstimateOpen(o => !o)}
                    id={`nav-${item.id}`}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {item.label}
                    <span className={`sidebar-expand-icon ${estimateOpen ? 'open' : ''}`}>›</span>
                  </div>
                  {estimateOpen && (
                    <SubMenu
                      items={item.children}
                      activePath={activePath}
                      onNavigate={navigate}
                    />
                  )}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`sidebar-item ${activePath === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                id={`nav-${item.id}`}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {item.label}
              </div>
            );
          })}

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '16px' }}>
            <div
              className="sidebar-item"
              onClick={handleLogout}
              id="nav-logout"
              style={{ color: '#f87171' }}
            >
              <span className="sidebar-item-icon">⬅</span>
              Logout
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
            <button className="header-btn header-btn-outline" id="header-help">
              ? Help
            </button>
            <button className="header-btn header-btn-outline" id="header-export">
              📤 Export
            </button>
            <button className="header-btn header-btn-primary" id="header-save">
              💾 Save
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

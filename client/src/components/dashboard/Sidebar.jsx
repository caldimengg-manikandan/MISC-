// src/components/dashboard/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Calculator,
  Database,
  FileText,
  Settings,
  Users,
  BarChart3,
  DollarSign,
  FolderOpen,
  HelpCircle,
  Box,
  Award,
  TrendingUp,
  Menu,
  X,
  ClipboardList,
  Building2,
  Target,
  Layers,
  HardHat,
  FileCode,
  Shield,
  Calendar,
  MessageSquare,
  Bell,
  Search,
  UserCog,
  ClipboardCheck, // Project Info
  ArrowUpDown     // Stair & Railings estimation
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../contexts/AuthContext'; // Import auth context

// Steel/Construction themed background pattern
const SteelBeamPattern = () => (
  <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none overflow-hidden">
    {/* Diagonal construction stripes */}
    <motion.div
      animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0"
      style={{
        backgroundImage: 'linear-gradient(45deg, #9ca3af 25%, transparent 25%, transparent 50%, #9ca3af 50%, #9ca3af 75%, transparent 75%, transparent)',
        backgroundSize: '40px 40px'
      }}
    />
    {/* Metallic sheen overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
  </div>
);

// Animated steel beam that slides across
const MovingBeam = () => (
  <motion.div
    initial={{ x: '-100%', opacity: 0 }}
    animate={{ x: '300%', opacity: [0, 1, 1, 0] }}
    transition={{ 
      duration: 5, 
      repeat: Infinity, 
      ease: "easeInOut",
      repeatDelay: 10 
    }}
    className="absolute top-0 left-0 h-full w-32 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent z-10 pointer-events-none"
  />
);

const Sidebar = ({ onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Get user from auth context

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [estimations, setEstimations] = useState([]);

  // Detect initial collapse state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
        if (onToggle) onToggle(false);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [onToggle]);

  // Function to navigate to correct dashboard based on user role
  const navigateToDashboard = () => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      navigate('/owner/dashboard');
    } else if (user?.role === 'user' && user?.trialExpired) {
      navigate('/restricted');
    } else {
      navigate('/dashboard');
    }

    // Close mobile menu if open
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  // Main menu items - Updated with new Engineering Platform routes
  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/home',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'dashboard',
      label: user?.role === 'owner' ? 'Admin Dashboard' : 'Dashboard',
      icon: user?.role === 'owner' ? UserCog : LayoutDashboard,
      path: user?.role === 'owner' ? '/owner/dashboard' : '/dashboard',
      color: user?.role === 'owner' ? 'from-purple-500 to-purple-700' : 'from-blue-500 to-blue-600',
      action: navigateToDashboard
    },
    // ── Engineering Platform ─────────────────────────────────────────
    {
      id: 'project-history',
      label: 'Project History',
      icon: FolderOpen,
      path: '/project-history',
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'project-info',
      label: 'Project Info',
      icon: ClipboardCheck,
      path: '/project-info',
      color: 'from-sky-500 to-cyan-600'
    },
    {
      id: 'stair-estimation',
      label: 'Estimate',
      icon: ArrowUpDown,
      path: '/estimate/stair-railings',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      path: '/reports',
      color: 'from-teal-500 to-teal-600'
    },
    // ── Legacy ───────────────────────────────────────────────────────
    {
      id: 'database',
      label: 'AISC',
      icon: Database,
      path: '/database',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'bim-viewer',
      label: '3D BIM',
      icon: Box,
      path: '/bim-viewer',
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'costing',
      label: 'Costing',
      icon: DollarSign,
      path: '/costing',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      path: '/help',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      color: 'from-gray-700 to-gray-800'
    },
    // ── Admin ────────────────────────────────────────────────────────
    ...((user?.role === 'admin' || user?.role === 'owner') ? [{
      id: 'admin-dictionary',
      label: 'Admin Tools',
      icon: UserCog,
      path: '/admin/dictionary',
      color: 'from-indigo-600 to-violet-700'
    }] : []),
  ];

  const handleNavigation = (item) => {
    if (item.action) {
      item.action();
      return;
    }

    navigate(item.path);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Determine active path for dashboard based on user role
  const getActivePath = () => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      return '/owner/dashboard';
    } else if (user?.role === 'user' && user?.trialExpired) {
      return '/restricted';
    }
    return '/dashboard';
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    const dashboardPath = getActivePath();

    if (path === '/dashboard' || path === '/owner/dashboard') {
      return currentPath === dashboardPath;
    }
    return currentPath === path;
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-white/10 text-white hover:bg-slate-800 transition-all duration-200"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Hamburger Toggle */}
      <motion.button
        onClick={toggleSidebar}
        className="hidden lg:flex fixed top-6 z-50 p-2 bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-white/10 text-white hover:bg-slate-800 hover:shadow-xl transition-all duration-200 items-center justify-center"
        style={{ left: isCollapsed ? '5rem' : '16rem' }}
        title="Toggle sidebar"
        initial={false}
        animate={{ left: isCollapsed ? '5rem' : '16rem' }}
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : window.innerWidth < 1024 ? -320 : 0,
          width: isCollapsed ? 100 : 280
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-40
          ${isMobileOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'}`}
      >
        <SteelBeamPattern />
        <MovingBeam />

        {/* Logo Section */}
        <div className="relative p-5 border-b border-white/10 z-20">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
             <div
                onClick={navigateToDashboard}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer group p-2 rounded-lg hover:bg-white/10 transition-colors duration-300 w-full`}
              >
                {/* Logo Icon - Always Visible */}
                <motion.div 
                   layout
                   className={`relative ${isCollapsed ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all duration-300 shrink-0 bg-transparent`}>
                  <img 
                    src="/OIP.webp" 
                    alt="MISCStairPro Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback if image fails to load */}
                  <div className={`absolute inset-0 hidden items-center justify-center bg-gradient-to-br ${user?.role === 'owner' ? 'from-purple-600 to-purple-800' : 'from-slate-700 to-slate-900'}`}>
                    <span className="text-white font-black text-lg font-mono">
                      {user?.role === 'owner' ? 'A' : 'M'}
                    </span>
                  </div>
                </motion.div>
                
                {/* Text Section - Hidden when collapsed */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 overflow-hidden whitespace-nowrap"
                    >
                      <h1 className="text-xl font-bold text-white tracking-tight">MISCStairPro</h1>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          {user?.role === 'owner' ? 'Admin Panel' : 'US Standards • Auto'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>



        {/* Navigation Menu - Circular Icons */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className={`${isCollapsed ? 'space-y-6' : 'space-y-4'}`}>
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center group relative z-10"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigation(item)}
                    className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} 
                      flex items-center justify-center shadow-lg
                      border-2 ${isActive(item.path) ? 'border-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : 'border-white/20'}
                      hover:shadow-blue-500/20 hover:border-white/50 transition-all duration-300 z-10 overflow-hidden`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md relative z-10" />
                    
                    {/* Metallic Glint/Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 pointer-events-none" />
                    
                    {/* Active Glow */}
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-white/20"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-2 w-12 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"
                      />
                    )}

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-center"
                      >
                        <span className={`text-xs font-bold tracking-wide uppercase ${isActive(item.path) ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {item.label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Actions Section */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 space-y-3"
            >
              {user?.role !== 'owner' && (
                <button
                  onClick={() => {
                    navigate('/estimation');
                    if (window.innerWidth < 1024) setIsMobileOpen(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-400 hover:to-green-500 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-green-900/20 hover:shadow-green-500/30"
                  disabled={user?.trialExpired}
                >
                  <Calculator className="w-5 h-5" />
                  <span className="font-semibold">
                    {user?.trialExpired ? 'Upgrade to Create' : 'New Estimation'}
                  </span>
                </button>
              )}

              <button
                onClick={() => navigate('/reports')}
                className="w-full py-3 bg-white/5 text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-sm"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">View Reports</span>
              </button>
            </motion.div>
          )}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
          {/* Copyright */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mt-3"
              >
                <div className="text-xs text-slate-500">
                  Developed by <span className="text-blue-400 font-semibold">CALDIM</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">© 2026 MISCStairPro</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main content spacer */}
      <div
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'
          } ${isMobileOpen ? 'pl-0' : ''}`}
      />
    </>
  );
};

export default Sidebar;

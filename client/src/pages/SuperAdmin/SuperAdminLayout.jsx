// client/src/pages/SuperAdmin/SuperAdminLayout.jsx
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Key,
  Users,
  History,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Licenses', path: '/superadmin/licenses', icon: Key },
    { label: 'Users', path: '/superadmin/users', icon: Users },
    { label: 'Activity Logs', path: '/superadmin/logs', icon: History },
    { label: 'System Config', path: '/superadmin/config', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a]/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col z-30">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CAL MISC</h1>
              <p className="text-xs text-indigo-400 font-medium tracking-widest uppercase">SuperAdmin Control</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-xl transition-all group
                    ${isActive
                      ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="active-pill">
                      <ChevronRight className="w-4 h-4 text-indigo-500" />
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800/50">
          <div className="bg-slate-800/30 rounded-2xl p-4 mb-4 border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border-2 border-indigo-500/30">
                {user?.email?.[0].toUpperCase() || 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Root Administrator</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-10 bg-[#020617]/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">SuperAdmin</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-white font-semibold">
              {navItems.find(i => location.pathname === i.path)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
              System Active
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;


import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { 
  Building2, 
  ArrowRight, 
  Clock, 
  Star,
  Zap,
  Layout,
  MousePointer2,
  Sparkles,
  HardHat,
  Ruler,
  Factory,
  Hammer,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cursor Animation State
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY]);

  // Quick Access Items
  const quickAccessItems = [
    {
      title: 'New Estimate',
      description: 'Start a new project estimation',
      icon: Ruler,
      path: '/costing',
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=400&h=300'
    },
    {
      title: 'Project Database',
      description: 'View and manage all projects',
      icon: Building2,
      path: '/projects',
      color: 'from-purple-500 to-pink-400',
      shadow: 'shadow-purple-500/30',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400&h=300'
    },
    {
      title: 'Recent Reports',
      description: 'Access your latest generated reports',
      icon: Clock,
      path: '/reports',
      color: 'from-green-500 to-emerald-400',
      shadow: 'shadow-green-500/30',
      image: 'https://images.unsplash.com/photo-1581094794329-cd119653243f?auto=format&fit=crop&q=80&w=400&h=300'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative cursor-none">
      {/* Custom Cursor */}
      <motion.div
        style={{
          translateX: cursorXSpring,
          translateY: cursorYSpring,
        }}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-white/50 bg-white/10 backdrop-blur-sm pointer-events-none z-[9999] mix-blend-difference flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-white rounded-full" />
      </motion.div>

      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533628635777-112b2239b1c7?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/90" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

      <Sidebar onToggle={setIsSidebarCollapsed} />
      
      <div className={`mt-14 transition-all duration-300 p-6 relative z-10 ml-0 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8 shadow-2xl relative overflow-hidden group"
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-indigo-200 mb-2">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-blue-100/80 text-lg flex items-center gap-2">
                <HardHat className="w-5 h-5 text-yellow-400" />
                Your steel estimation command center is ready.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-white">{user?.email || 'User ID'}</div>
              </div>
              <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl p-10 text-white shadow-2xl mb-12 relative overflow-hidden border border-white/10 group min-h-[400px] flex items-center"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1920" 
                alt="Steel Construction" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium flex items-center gap-2">
                    <Factory className="w-4 h-4" />
                    Industrial Grade Estimation
                  </span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-bold mb-6 leading-tight"
                >
                  Build with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Precision & Power</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-blue-100/90 mb-8 text-lg leading-relaxed max-w-xl"
                >
                  Create comprehensive steel estimations with our advanced tools. 
                  Access the AISC database, calculate costs, and generate professional reports with ease.
                </motion.p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/costing')}
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg shadow-black/20 flex items-center gap-3 group/btn"
                >
                  Start New Estimate
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Quick Access Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                onClick={() => navigate(item.path)}
                className={`relative rounded-2xl overflow-hidden cursor-none group h-64 ${item.shadow}`}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30 group-hover:via-slate-900/40 transition-all duration-500" />
                </div>
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2 transform group-hover:-translate-y-1 transition-transform duration-300">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 transform group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                    {item.description}
                  </p>
                  
                  <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Border Glow */}
                <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-white/30 transition-colors pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Updates / News Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Hammer className="w-6 h-6 text-blue-400 animate-pulse" />
              Latest Construction Updates
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  title: "New AISC Database Updated",
                  desc: "The steel shapes database has been updated with the latest AISC specifications.",
                  time: "Today",
                  color: "bg-blue-500/20 text-blue-300",
                  icon: Layout
                },
                {
                  title: "Improved Reporting Tools",
                  desc: "Generate more detailed cost breakdowns with our enhanced reporting engine.",
                  time: "Yesterday",
                  color: "bg-purple-500/20 text-purple-300",
                  icon: Clock
                }
              ].map((update, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  className="flex items-center p-4 rounded-xl border border-white/5 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg ${update.color} flex items-center justify-center mr-4`}>
                    <update.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                      {update.title}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {update.desc}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    {update.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Home;

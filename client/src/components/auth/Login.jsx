// client/src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, UserPlus, Shield, Calculator, Factory, 
  HardHat, Zap, Building2, Users, ArrowRight,
  ChevronRight, CheckCircle, Crown, Lock, Mail,
  Phone, Briefcase, Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOwnerLogin, setIsOwnerLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company: '',
    phone: '',
    specialty: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register, loading: authLoading } = useAuth();

  // Handle local loading state combined with auth loading
  const isProcessing = loading || authLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password, isOwnerLogin);
      } else {
        await register(formData, isOwnerLogin);
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    { icon: <Factory className="w-5 h-5" />, name: 'Industrial Steel' },
    { icon: <Building2 className="w-5 h-5" />, name: 'Commercial Const.' },
    { icon: <Zap className="w-5 h-5" />, name: 'Misc Fabrication' }
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Left Column: Visual Branding - Industrial Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: "url('/images/industrial-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/60 to-transparent" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px' 
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 mb-12"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/20">
                <Factory className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  MISC<span className="text-blue-500">Stair</span>Pro
                </h1>
                <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Precision Engineering Suite</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-md"
            >
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                Standardizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Industrial Excellence</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-8">
                The industry-leading platform for structural steel estimation, fabrication planning, and miscellaneous steel management.
              </p>

              <div className="space-y-4">
                {industries.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-center space-x-3 text-slate-300 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-lg w-fit"
                  >
                    <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center space-x-6 text-slate-500 text-sm border-t border-white/10 pt-8"
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>AISC & IBC Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Global Standards</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-zinc-950 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full -ml-64 -mb-64" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header Mobile Only */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MISCStairPro</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-slate-400">
              {isLogin 
                ? 'Access your structural fabrication workspace'
                : 'Join the industry standard for steel estimation'}
            </p>
          </div>

          {/* Role Toggle */}
          <div className="mb-8 p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex">
            <button
              onClick={() => setIsOwnerLogin(false)}
              className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                !isOwnerLogin 
                  ? 'bg-zinc-800 text-blue-400 shadow-sm shadow-black/40 border border-zinc-700' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Professional
            </button>
            <button
              onClick={() => setIsOwnerLogin(true)}
              className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                isOwnerLogin 
                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Owner
            </button>
          </div>

          {/* Main Action Toggle */}
          <div className="flex border-b border-zinc-800 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-4 px-6 text-sm font-semibold transition-all relative ${
                isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Login
              {isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-4 px-6 text-sm font-semibold transition-all relative ${
                !isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Register
              {!isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Capacity</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-600 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      required={!isLogin}
                      placeholder="Organization Ltd."
                      className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                {!isOwnerLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Specialty</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" />
                        <select
                          className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        >
                          <option value="">Select</option>
                          <option value="commercial">Commercial</option>
                          <option value="industrial">Industrial</option>
                          <option value="misc">Misc Steel</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-600 group-focus-within:text-blue-500" />
                        <input
                          type="tel"
                          placeholder="+1..."
                          className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Secure Access</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-600 group-focus-within:text-blue-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-950" />
                  <span className="text-sm text-slate-500">Stay signed in</span>
                </label>
                <button type="button" className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
                  Reset Password
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all transform active:scale-[0.98] ${
                isProcessing 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{isLogin ? 'Enter Workspace' : 'Initialize Account'}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          {/* Trust Footer */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-xs">
              Powered by industrial-grade security protocols. 
              <br />
              All computations are AISC-verified and stored securely.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
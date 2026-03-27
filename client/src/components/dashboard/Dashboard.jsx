import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Clock, Activity, Target, 
  Sparkles, PieChart, Shield, Zap, Search, ChevronDown, 
  Calculator, Ruler
} from 'lucide-react';
import Sidebar from './Sidebar';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200">
      <Sidebar onToggle={setIsSidebarCollapsed} />
      
      <div className={`mt-14 transition-all duration-300 p-8 ${isSidebarCollapsed ? 'lg:ml-[100px]' : 'lg:ml-[280px]'}`}>
        
        {/* Modern Engineering Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Neural <span className="text-blue-500 not-italic">Analytics</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Live Fabrication Engine</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">Analytics</button>
              <button className="px-4 py-1.5 rounded-lg text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Estimator</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 transition-all">
                <Calculator className="w-4 h-4" />
              </button>
              <button className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 transition-all">
                <Ruler className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 backdrop-blur-xl bg-slate-800/30 p-2 rounded-2xl border border-slate-700/50">
            <div className="relative group">
               <input 
                 type="text" 
                 placeholder="Search Intel..." 
                 className="bg-transparent border-none focus:ring-0 text-sm pl-10 pr-4 placeholder:text-slate-600 w-48 md:w-64"
               />
               <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <div className="h-6 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer group">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">SP</div>
               <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
            </div>
          </div>
        </header>

        {/* Predictive Intelligence Banners (Neural Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden group rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-5"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Price Volatility Index</h3>
                <p className="text-xs text-slate-400 mt-1">Carbon Steel (A36) surged 6.2% this week. Strategic re-quoting recommended.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden group rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-5"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-16 h-16 text-amber-400" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Labor Capacity Guard</h3>
                <p className="text-xs text-slate-400 mt-1">Shop is at 92% capacity. Suggest extending lead times by +7 business days.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global KPI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden"
           >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Quoted Value</div>
             <div className="text-4xl font-black text-white">$2,485k</div>
             <div className="flex items-center gap-2 mt-4">
               <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold">+12.4%</span>
               <span className="text-[10px] text-slate-500 font-bold uppercase">vs last month</span>
             </div>
           </motion.div>

           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden"
           >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Pipeline Tonnage</div>
             <div className="text-4xl font-black text-white">142.5<span className="text-lg ml-1 text-slate-500">T</span></div>
             <div className="mt-5 space-y-2">
               <div className="flex justify-between text-[10px] font-bold text-slate-400">
                 <span>68% OF TARGET</span>
                 <span className="text-blue-400">210T GOAL</span>
               </div>
               <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '68%' }}
                   className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                 />
               </div>
             </div>
           </motion.div>

           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden"
           >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-transparent" />
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Labor Backlog</div>
             <div className="text-4xl font-black text-white">1,250<span className="text-lg ml-1 text-slate-500">Hrs</span></div>
             <div className="flex items-center gap-3 mt-5">
               <div className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 text-[10px] font-black uppercase">High Load</div>
               <span className="text-[10px] text-slate-400 font-bold">92% TOTAL CAPACITY</span>
             </div>
           </motion.div>
        </div>

        {/* Analytical Intelligence Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Material Distribution Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Material Distribution</h2>
                <p className="text-sm text-slate-500">Asset weight allocation by assembly type</p>
              </div>
              <PieChart className="w-6 h-6 text-slate-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Stairs', value: 45 },
                        { name: 'Railings', value: 35 },
                        { name: 'Landings', value: 20 }
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3B82F6" shadow="0 0 20px #3B82F6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#8B5CF6" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#F8FAFC' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">100%</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total lbs</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Stairs', val: '45%', color: '#3B82F6' },
                  { label: 'Railings', val: '35%', color: '#10B981' },
                  { label: 'Landings', val: '20%', color: '#8B5CF6' }
                ].map((item, index) => (
                  <div key={index} className="group p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-white font-mono">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quote Accuracy Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Precision Index</h2>
                <p className="text-sm text-slate-500">Estimated vs Actual weight deviation</p>
              </div>
              <Activity className="w-6 h-6 text-slate-600" />
            </div>

            <div className="h-64 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'P1', est: 1200, act: 1250 },
                  { name: 'P2', est: 4500, act: 4620 },
                  { name: 'P3', est: 800, act: 810 },
                  { name: 'P4', est: 2200, act: 2350 },
                  { name: 'P5', est: 1100, act: 1080 }
                ]}>
                  <defs>
                    <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="est" stroke="#3B82F6" fill="url(#colorEst)" strokeWidth={3} />
                  <Area type="monotone" dataKey="act" stroke="#F59E0B" fill="url(#colorAct)" strokeWidth={3} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-4">
               <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
               </div>
               <p className="text-xs text-blue-200/70 font-medium leading-relaxed italic">
                 "Neural analysis suggests 11% scrap markup is performing at 98.4% efficiency. Maintain existing rule."
               </p>
            </div>
          </motion.div>

        </div>

        {/* Win Rate Strategy Intelligence */}
        <div className="mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group bg-slate-900/50 backdrop-blur-2xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[120px] -mr-32 -mt-32" />
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Win Success Strategy</h2>
                   <p className="text-sm text-slate-500">Global bidding performance and optimization</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-[10px] font-black tracking-widest text-slate-400 uppercase">Live Intel</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: 'Wall Rails', win: 85, trend: '+5.2%', color: '#3B82F6' },
                { name: 'Picket Rails', win: 22, trend: '-2.1%', color: '#EF4444' },
                { name: 'Stairs', win: 48, trend: '+1.4%', color: '#F59E0B' },
                { name: 'Landings', win: 65, trend: '+0.8%', color: '#10B981' }
              ].map((segment, idx) => (
                <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all">
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{segment.name}</div>
                   <div className="flex items-center justify-between mt-3">
                     <div className="text-2xl font-black text-white">{segment.win}%</div>
                     <span className={`text-[10px] font-bold ${segment.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{segment.trend}</span>
                   </div>
                   <div className="w-full h-1 bg-slate-700/50 rounded-full mt-4">
                     <div className="h-full rounded-full" style={{ width: `${segment.win}%`, backgroundColor: segment.color }} />
                   </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
               <div className="flex -space-x-3">
                 {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700" />)}
                 <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">+12</div>
               </div>
               <div className="text-sm font-medium text-slate-300">
                  <span className="text-emerald-400 font-black">AI Strategy:</span> High dominance in Wall Rails (85% win). Increase margins by <span className="text-white font-bold underline decoration-emerald-500/50 text-base">5.0%</span> to maximize profit capture without losing volume.
               </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
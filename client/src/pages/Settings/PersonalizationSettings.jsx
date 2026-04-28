import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Paintbrush, Sun, Moon, Layout, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ColorOption = ({ color, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-10 rounded-full border-2 transition-all ${isActive ? 'border-white ring-2 ring-blue-500 scale-110' : 'border-transparent hover:scale-105'}`}
    style={{ backgroundColor: color }}
  />
);

export default function PersonalizationSettings() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('app-accent') || '#10a37f');

  // Apply theme change
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Apply accent color (conceptual - would usually update CSS variables)
  useEffect(() => {
    localStorage.setItem('app-accent', accent);
    document.documentElement.style.setProperty('--gpt-accent', accent);
  }, [accent]);

  const handleSave = () => {
    toast.success('Appearance preferences updated!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalization</h1>
          <p className="text-slate-500 mt-1">Customize your workspace appearance and experience.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg transition-all"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sun size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Interface Theme</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
            >
              <Sun size={24} className={theme === 'light' ? 'text-blue-600' : 'text-slate-400'} />
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-blue-900' : 'text-slate-500'}`}>Light Mode</span>
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
            >
              <Moon size={24} className={theme === 'dark' ? 'text-blue-600' : 'text-slate-400'} />
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-blue-900' : 'text-slate-500'}`}>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Accent Color Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Paintbrush size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Accent Color</h2>
          </div>

          <div className="flex flex-wrap gap-4">
            {['#10a37f', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0f172a'].map(c => (
              <ColorOption 
                key={c} 
                color={c} 
                isActive={accent === c} 
                onClick={() => setAccent(c)} 
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 italic mt-2">Choosing an accent color updates your primary brand color across the app.</p>
        </div>

        {/* Layout Preferences */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Layout size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Workspace Layout</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-slate-100 rounded-xl relative overflow-hidden group cursor-pointer">
              <div className="absolute top-3 right-3 text-blue-500"><Check size={16} /></div>
              <div className="font-bold text-slate-800 mb-1">Standard Sidebar</div>
              <div className="text-xs text-slate-500">Full visibility for all estimation modules.</div>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl group cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="font-bold text-slate-800 mb-1">Compact View</div>
              <div className="text-xs text-slate-500">Maximize space for 3D viewers and layouts.</div>
            </div>
            <div className="p-4 border border-slate-100 rounded-xl group cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="font-bold text-slate-800 mb-1">Engineering Mode</div>
              <div className="text-xs text-slate-500">Display density optimized for heavy data entry.</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


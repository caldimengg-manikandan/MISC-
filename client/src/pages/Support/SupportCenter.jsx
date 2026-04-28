import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, BookOpen, Download, MessageSquare, ExternalLink, Mail, Phone, X, FileText, Cpu, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

const DocumentationModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-blue-400" />
              <div>
                <h2 className="text-xl font-bold">Estimation Intelligence Guide</h2>
                <p className="text-slate-400 text-xs">A comprehensive overview of the Stair Estimation Engine</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Logic Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Cpu size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Core Calculation Logic</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-2">Weight Matrix</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Weights are derived from physical geometry. Steel density is calculated as <span className="font-mono text-blue-600">Base Weight * (1 + Scrap %)</span>. 
                    Pans and landings utilize surface area (SF) while rails use linear footage (LF).
                  </p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-2">Financial Engine</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Costs aggregate Material + Finish + Labor. Finish costs (Galvanize/Powder Coat) are applied strictly to base steel weight. 
                    Tax logic follows state-level configurations defined in Organization Defaults.
                  </p>
                </div>
              </div>
            </section>

            {/* Components Section */}
            <section>
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><BarChart3 size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Mastering Components</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Stair Flights", desc: "Complex geometric assemblies. Supports pan-fill, bar grating, and custom stringer sizing." },
                  { title: "Landings & Platforms", desc: "Calculated by square footage. Auto-suggests material thicknesses based on width buckets." },
                  { title: "Railing Systems", desc: "Wall rails and guard rails. Supports floor-mounted, embedded, or wall-bolted configurations." }
                ].map((c) => (
                  <div key={c.title} className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="text-emerald-500 mt-1">◈</div>
                    <div>
                      <div className="font-bold text-slate-800">{c.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

             {/* Pricing Section */}
             <section>
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><SettingsIcon size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">System Administration</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                The **Pricing Settings** module is the central nervous system of the app. Updating global rates here affects all real-time previews. 
                Use the **Batch Recalculate** feature periodically to synchronize historical project data with new organizational benchmarks.
              </p>
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 font-medium">
                <strong>ENGINEER NOTICE:</strong> Always verify that "Scrap %" and "Misc Markups" align with your physical shop benchmarks (typically 10-11% for fabrication).
              </div>
            </section>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
              Got it, understood
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SupportCard = ({ icon: Icon, title, description, linkText, color, onClick }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
    <div className={`p-3 w-fit rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
    </div>
    <button 
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors w-fit group"
    >
      {linkText} <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
    </button>
  </div>
);

export default function SupportCenter() {
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const handleDownloadTemplate = async () => {
    const t = toast.loading("Fetching Master Template...");
    try {
      const token = localStorage.getItem('steel_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/download`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("File not found");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Master_Fabrication_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Template download started", { id: t });
    } catch (err) {
      toast.error("Failed to download template. Please contact admin.", { id: t });
    }
  };

  const openSupportMail = () => {
    window.location.href = "mailto:support@steelestimation.com?subject=Technical%20Assistance%20Request&body=Hi%20Engineering%20Team,%0A%0AI%20need%20help%20with%20the%20following%20calculation:%0A%0A[Describe%20Issue%20Here]";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6"
    >
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support & Documentation</h1>
        <p className="text-slate-500 mt-1">Get help with your estimations or download calculation templates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SupportCard 
          icon={BookOpen}
          color="bg-blue-50 text-blue-600"
          title="User Documentation"
          description="Learn how to configure complex stairs, landings, and rail assemblies with our comprehensive guide."
          linkText="Read Docs"
          onClick={() => setIsDocsOpen(true)}
        />
        <SupportCard 
          icon={Download}
          color="bg-emerald-50 text-emerald-600"
          title="Excel Templates"
          description="Download the latest Master Fabrication Excel sheets to verify your estimations offline."
          linkText="View Templates"
          onClick={handleDownloadTemplate}
        />
        <SupportCard 
          icon={MessageSquare}
          color="bg-purple-50 text-purple-600"
          title="Direct Support"
          description="Need help with a specific calculation? Reach out to our engineering support team."
          linkText="Open Ticket"
          onClick={openSupportMail}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          <h2 className="text-2xl font-bold">Contact Engineering</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our support desk is available Monday–Friday, 9 AM to 5 PM EST for technical assistance with the estimation engine.
          </p>
          
          <div className="space-y-4">
             <a href="mailto:support@steelestimation.com" className="flex items-center gap-4 group cursor-pointer">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-300 group-hover:text-blue-400 transition-colors"><Mail size={18} /></div>
                <div className="text-sm font-semibold group-hover:text-blue-400 transition-colors">support@steelestimation.com</div>
             </a>
             <a href="tel:+15551234567" className="flex items-center gap-4 group cursor-pointer">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-300 group-hover:text-emerald-400 transition-colors"><Phone size={18} /></div>
                <div className="text-sm font-semibold group-hover:text-emerald-400 transition-colors">+1 (555) 123-4567</div>
             </a>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100">
           <h2 className="text-xl font-bold text-slate-800 mb-6">System Information</h2>
           <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                 <span className="text-sm text-slate-500 font-medium">Core Engine Version</span>
                 <span className="text-sm font-bold text-slate-800">v2.4.1 (Stable)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                 <span className="text-sm text-slate-500 font-medium">Last Pricing Sync</span>
                 <span className="text-sm font-bold text-emerald-600">Today, 10:45 AM</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                 <span className="text-sm text-slate-500 font-medium">Database Node</span>
                 <span className="text-sm font-bold text-slate-800">MSSQL-PROD-01</span>
              </div>
           </div>
        </div>
      </div>

      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </motion.div>
  );
}



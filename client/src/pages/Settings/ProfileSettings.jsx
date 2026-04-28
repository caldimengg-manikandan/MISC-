import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Shield, Clock, Phone, Globe, 
  Save, Edit3, Camera, Building, Target, Activity, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

const InfoRow = ({ icon: Icon, label, value, field, isEditable = true, isEditing, formData, setFormData }) => (
  <div className="flex items-center gap-4 py-5 border-b border-slate-100 last:border-0">
    <div className={`p-2.5 rounded-xl ${isEditing && isEditable ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</div>
      {isEditing && isEditable ? (
        <input 
          type="text"
          value={formData[field]}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
        />
      ) : (
        <div className="text-slate-800 font-bold whitespace-pre-wrap">{value || 'Not provided'}</div>
      )}
    </div>
  </div>
);

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ totalProjects: 0, totalEstimations: 0 });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(!!user?.mfa_enabled);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    region: user?.region || 'United States',
    company: user?.company || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [isDisableMfaModalOpen, setIsDisableMfaModalOpen] = useState(false);
  const { setupMFA, verifyMFASetup, disableMFA } = useAuth();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        region: user.region || 'United States',
        company: user.company || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
      setIs2FAEnabled(!!user.mfa_enabled);
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/projects`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats({
          totalProjects: data.projects?.length || 0,
          totalEstimations: data.projects?.reduce((acc, p) => acc + (p.stairs ? 1 : 0), 0) || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800000) { 
        toast.error("Image too large. Please use < 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const t = toast.loading("Updating profile...");
    const res = await updateUser(formData);
    if (res.success) {
      setIsEditing(false);
      toast.success("Profile saved!", { id: t });
    } else {
      toast.error("Failed to update profile", { id: t });
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const t = toast.loading("Updating password...");
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, { credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated!", { id: t });
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || "Update failed", { id: t });
      }
    } catch (err) {
      toast.error("Network error", { id: t });
    }
  };

  const handleStartMFASetup = async () => {
    const t = toast.loading("Initializing security...");
    try {
      const res = await setupMFA();
      if (res.success) {
        setMfaSetupData(res);
        setIsMfaModalOpen(true);
        toast.dismiss(t);
      } else {
        toast.error(res.error || "MFA Setup failed", { id: t });
      }
    } catch (err) {
      toast.error("Failed to start MFA setup", { id: t });
    }
  };

  const handleVerifyMFASetup = async () => {
    const t = toast.loading("Verifying code...");
    try {
      const res = await verifyMFASetup(mfaCode);
      if (res.success) {
        toast.success("MFA successfully enabled!", { id: t });
        setIsMfaModalOpen(false);
        setIs2FAEnabled(true);
      } else {
        toast.error(res.error || "Invalid code", { id: t });
      }
    } catch (err) {
      toast.error("Verification error", { id: t });
    }
  };

  const handleDisableMFA = async () => {
    if (mfaCode.length !== 6) return toast.error("Enter a 6-digit code");
    const t = toast.loading("Disabling 2FA...");
    try {
      const res = await disableMFA(mfaCode);
      if (res.success) {
        setIsDisableMfaModalOpen(false);
        setIs2FAEnabled(false);
        setMfaCode('');
        toast.dismiss(t);
      }
    } catch (err) {
      toast.error("Network error", { id: t });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const getInitials = (userName) => {
    if (!userName) return user.email?.[0].toUpperCase();
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Profile</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your engineering profile and account security.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Edit3 size={18} /> Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : getInitials(formData.name)}
              </div>
              <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <label htmlFor="avatar-upload" className="absolute bottom-6 right-0 p-2.5 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
                <Camera size={18} />
              </label>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900">{formData.name || (user?.email?.split('@')[0])}</h2>
            <div className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest mt-3">
              {user.role} Account
            </div>

            <div className="w-full mt-8 p-6 bg-slate-50 rounded-2xl text-left border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Professional Bio</div>
              {isEditing ? (
                 <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about your engineering role..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                 />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {formData.bio || "No professional summary added yet."}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80} /></div>
             <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Target size={18} className="text-blue-400" /> Interaction Stats
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="text-2xl font-black text-blue-400">{stats.totalProjects}</div>
                   <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Projects</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="text-2xl font-black text-emerald-400">{stats.totalEstimations}</div>
                   <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Estimations</div>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20} /></div>
                <h3 className="text-xl font-bold text-slate-800">Account Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <InfoRow icon={User} label="Full Legal Name" value={formData.name} field="name" isEditing={isEditing} formData={formData} setFormData={setFormData} />
                <InfoRow icon={Mail} label="Contact Email" value={user.email} isEditable={false} isEditing={isEditing} formData={formData} setFormData={setFormData} />
                <InfoRow icon={Building} label="Organization" value={formData.company} field="company" isEditing={isEditing} formData={formData} setFormData={setFormData} />
                <InfoRow icon={Phone} label="Mobile / Office" value={formData.phone} field="phone" isEditing={isEditing} formData={formData} setFormData={setFormData} />
                <InfoRow icon={Globe} label="Region / Timezone" value={formData.region} field="region" isEditing={isEditing} formData={formData} setFormData={setFormData} />
                <InfoRow icon={Clock} label="Member Since" value={formatDate(user.trialStart)} isEditable={false} isEditing={isEditing} formData={formData} setFormData={setFormData} />
              </div>
           </div>

           <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Shield size={20} /></div>
                <h3 className="text-xl font-bold text-slate-800">Security & Privacy</h3>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-900">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {is2FAEnabled ? "2FA is active." : "Add an extra layer of security using an authenticator app."}
                      </p>
                   </div>
                    <div className="flex gap-2">
                      {is2FAEnabled ? (
                        <button 
                          onClick={() => setIsDisableMfaModalOpen(true)}
                          className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button 
                          onClick={handleStartMFASetup} 
                          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                          Configure 2FA
                        </button>
                      )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-900">Update Password</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Security PIN update.</p>
                   </div>
                   <button onClick={() => setIsPasswordModalOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all">
                      Change PIN
                   </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Change Security PIN</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Current Password</label>
                  <input type="password" onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                  <input type="password" onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Confirm New Password</label>
                  <input type="password" onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-xl">Cancel</button>
                <button onClick={handleUpdatePassword} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Update PIN</button>
              </div>
            </motion.div>
          </div>
        )}

        {isMfaModalOpen && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">Configure 2FA</h2>
                <button onClick={() => setIsMfaModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="text-center space-y-6">
                <p className="text-slate-500 text-sm">Scan this QR code with Google Authenticator or Authy to secure your account.</p>
                
                {mfaSetupData?.qrCodeUrl && (
                  <div className="bg-white p-4 inline-block rounded-2xl border-2 border-slate-50 shadow-inner mx-auto">
                    <img src={mfaSetupData.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                )}
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backup Code</div>
                  <code className="text-slate-800 font-mono font-bold text-lg select-all">{mfaSetupData?.secret}</code>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase text-left">Enter 6-digit verification code</label>
                  <input 
                    type="text" 
                    placeholder="000 000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl tracking-[0.5em] font-black border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" 
                  />
                  <button 
                    onClick={handleVerifyMFASetup}
                    disabled={mfaCode.length !== 6}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isDisableMfaModalOpen && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">Disable 2FA</h2>
                <button onClick={() => setIsDisableMfaModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                <p className="text-slate-500 text-sm">To disable Two-Factor Authentication, please enter the current 6-digit code from your authenticator app.</p>
                
                <div className="space-y-3 pt-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase text-left">Verification Code</label>
                  <input 
                    type="text" 
                    placeholder="000 000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl tracking-[0.5em] font-black border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all" 
                  />
                  <button 
                    onClick={handleDisableMFA}
                    disabled={mfaCode.length !== 6}
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Disable
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


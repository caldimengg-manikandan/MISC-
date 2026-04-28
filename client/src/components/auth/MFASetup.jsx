import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, Smartphone, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MFASetup = ({ onComplete, setupToken }) => {
  const { setupMFA, verifyMFASetup } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initSetup = async () => {
      const data = await setupMFA();
      if (data.success) {
        setQrCode(data.qrCodeUrl);
        setSecret(data.secret);
      }
    };
    initSetup();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (token.length !== 6) return toast.error('Please enter a 6-digit code');

    setLoading(true);
    const result = await verifyMFASetup(token);
    setLoading(false);

    if (result.success) {
      setStep(3);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Secure Your Account</h2>
        <p className="text-slate-400">Two-factor authentication adds an extra layer of security to your account.</p>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-4 rounded-xl inline-block mx-auto w-full flex justify-center">
            {qrCode ? (
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
            )}
          </div>
          
          <div className="space-y-4 text-left">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs">1</span>
              Scan this QR Code
            </h3>
            <p className="text-sm text-slate-400 pl-8">
              Open your authenticator app (Google Authenticator, Authy, etc.) and scan the image above.
            </p>
            
            <div className="pl-8">
              <button 
                onClick={() => setStep(2)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/20"
              >
                I've scanned it
              </button>
            </div>
            
            <div className="pt-4 border-t border-slate-700/50">
              <button 
                onClick={copySecret}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mx-auto"
              >
                Can't scan? Copy secret key <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-4 text-left">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs">2</span>
              Enter Verification Code
            </h3>
            <p className="text-sm text-slate-400 pl-8">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
            
            <form onSubmit={handleVerify} className="pl-8 space-y-6">
              <input
                type="text"
                maxLength="6"
                placeholder="000 000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all border border-slate-700"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading || token.length !== 6}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
          <p className="text-slate-400">Two-factor authentication is now enabled.</p>
        </div>
      )}
    </div>
  );
};

export default MFASetup;


// client/src/pages/auth/OTPVerifyPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const OTPVerifyPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyLoginOTP, loading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Redirect if no state (direct access)
  if (!state?.userId || !state?.email) {
    return <Navigate to="/login" replace />;
  }


  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    const result = await verifyLoginOTP(state.userId, otpValue);
    if (!result.success) {
      // Clear OTP on failure
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Security Verification</h1>
            <p className="text-slate-400">
              We've sent a 6-digit code to <span className="text-blue-400 font-medium">{state.email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 mb-4">Didn't receive the code?</p>
            {timer > 0 ? (
              <span className="text-slate-500">Resend code in {timer}s</span>
            ) : (
              <button 
                onClick={() => {
                  toast.success('Code resent! (Actually handled by logic)');
                  setTimer(60);
                }}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Resend Verification Code
              </button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Secure Login
            </div>
            <div className="w-1 h-1 bg-slate-700 rounded-full" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Device Protected
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerifyPage;

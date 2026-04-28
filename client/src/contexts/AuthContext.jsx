// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import axios from 'axios';
import API_BASE_URL from '../config/api';


const API_URL = `${API_BASE_URL}/api/v1`;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('steel_user');

      if (storedUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify`, {
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              localStorage.setItem('steel_user', JSON.stringify(data.user));
              setUser(data.user);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('steel_user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            localStorage.removeItem('steel_user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          localStorage.removeItem('steel_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('auth/login', { email, password });
      const data = response.data;
      console.log('DEBUG AuthContext: Login Response Data:', data);

      if (data.requiresOTP) {
        navigate('/otp-verify', { state: { userId: data.userId, email } });
        return { success: true, requiresOTP: true };
      }

      if (data.requiresMfa) {
        return { success: true, requiresMfa: true, mfaToken: data.mfaToken };
      }
      
      if (data.requiresMfaSetup) {
        return { success: true, requiresMfaSetup: true, setupToken: data.setupToken };
      }

      if (data.user) {
        if (data.token) localStorage.setItem('steel_token', data.token);
        localStorage.setItem('steel_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);

        if (data.user.mfaWarning) toast('Please set up MFA soon for better security!', { icon: '🛡️' });

        if (data.mustChangePassword) {
          toast.success('Login successful! Please update your password.');
          navigate('/profile'); 
        } else {
          toast.success('Login successful!');
          navigate(data.user.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');
        }
        return { success: true };
      }

      return { success: true, ...data };
    } catch (error) {
      // Error handled by interceptor or custom here
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // VERIFY LOGIN OTP (New Device)
  const verifyLoginOTP = async (userId, otp) => {
    try {
      setLoading(true);
      const response = await api.post('auth/verify-login-otp', { userId, otp });
      const data = response.data;

      if (data.requiresMfa) {
        return { success: true, requiresMfa: true, mfaToken: data.mfaToken };
      }
      if (data.requiresMfaSetup) {
        return { success: true, requiresMfaSetup: true, setupToken: data.setupToken };
      }

      if (data.user) {
        localStorage.setItem('steel_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        if (data.user.mfaWarning) toast('Please set up MFA soon for better security!', { icon: '🛡️' });
        toast.success('Verification successful!');
        navigate(data.user.role === 'superadmin' ? '/superadmin/dashboard' : '/home');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Verification failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };



  // ACTIVATE ACCOUNT (Invite Link)
  const activateAccount = async (token, password) => {
    try {
      setLoading(true);
      const response = await api.post('auth/activate', { token, password });
      toast.success(response.data.message || 'Account activated successfully!');
      navigate('/login');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Activation failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const register = async (userData, isOwner = false, redirectTo = null) => {
    try {
      setLoading(true);
      
      const endpoint = isOwner 
        ? `${API_BASE_URL}/api/v1/auth/register-owner`
        : `${API_BASE_URL}/api/v1/auth/register`;

      const response = await fetch(endpoint, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) localStorage.setItem('steel_token', data.token);
        localStorage.setItem('steel_user', JSON.stringify(data.user));

        setUser(data.user);
        setIsAuthenticated(true);

        toast.success(isOwner ? 'Owner account created!' : 'Account created!');
        
        // Use redirectTo if provided, otherwise default based on role
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/estimate/stair-railings');
        }

        return { success: true, user: data.user };
      } else {
        toast.error(data.error || 'Registration failed');
        return { success: false };
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch (e) {
      // Ignore logout errors, just clear local state
    }
    localStorage.removeItem('steel_user');
    localStorage.removeItem('steel_token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // TRIAL ACCESS CHECK
  const checkAccess = async (feature) => {
    try {
      if (user?.role === 'owner') return true;

      const response = await fetch(`${API_BASE_URL}/api/v1/trial/check`, { credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ feature })
      });

      if (response.ok) {
        const data = await response.json();
        return data.allowed;
      }
      return false;
    } catch {
      return false;
    }
  };

  // TRIAL STATUS
  const checkTrialStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/trial/status`, {
        credentials: 'include'
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  // UPDATE PROFILE
  const updateUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/update-profile`, { credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('steel_user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Profile updated successfully');
        return { success: true };
      }

      return { success: false };
    } catch {
      toast.error('Network error');
      return { success: false };
    }
  };

  // FORGOT PASSWORD
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        return { success: true };
      } else {
        toast.error(data.error || 'Failed to send OTP');
        return { success: false, error: data.error };
      }
    } catch (error) {
      toast.error('Network error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const verifyOTP = async (email, otp) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp });
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async (email, otp, newPassword) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Reset failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const sendSignupOTP = async (email) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/send-otp`, { email });
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send code');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOTP = async (email, otp) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const isOwner = () => user?.role === 'owner';
  
  // MFA SUPPORT
  const setupMFA = async (setupToken) => {
    setAuthActionLoading(true);
    try {
      const headers = setupToken ? { Authorization: `Bearer ${setupToken}` } : {};
      const res = await api.get('auth/mfa/setup', { headers });
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.error || 'MFA Setup failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthActionLoading(false);
    }
  };

  const verifyMFASetup = async (code, setupToken) => {
    setAuthActionLoading(true);
    try {
      const headers = setupToken ? { Authorization: `Bearer ${setupToken}` } : {};
      const res = await api.post('auth/mfa/verify', { token: code }, { headers });
      if (res.data.success && res.data.user) {
        const updatedUser = { ...user, ...res.data.user };
        localStorage.setItem('steel_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success('MFA Setup complete!');
      }
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.error || 'Verification failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthActionLoading(false);
    }
  };

  const loginMFA = async (mfaToken, code) => {
    setLoading(true);
    try {
      const res = await api.post('auth/mfa/login', { mfaToken, token: code });
      if (res.data.success && res.data.token) {
        localStorage.setItem('steel_token', res.data.token);
        localStorage.setItem('steel_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        navigate(res.data.user.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');
      }
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.error || 'Invalid MFA code';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const loginMFAOnly = async (email, code) => {
    setLoading(true);
    try {
      const res = await api.post('auth/login-mfa', { email, code });
      if (res.data.success && res.data.token) {
        localStorage.setItem('steel_token', res.data.token);
        localStorage.setItem('steel_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        navigate(res.data.user.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');
      }
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.error || 'MFA login failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async (code) => {
    setAuthActionLoading(true);
    try {
      const res = await api.post('auth/mfa/disable', { code });
      if (res.data.success) {
        const updatedUser = { ...user, mfa_enabled: false };
        localStorage.setItem('steel_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success('2FA has been disabled');
      }
      return res.data;
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to disable MFA';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setAuthActionLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAccess,
        checkTrialStatus,
        updateUser,
        forgotPassword,
        verifyLoginOTP,
        activateAccount,
        verifyOTP,
        resetPassword,
        sendSignupOTP,
        verifySignupOTP,
        signup,
        setupMFA,
        verifyMFASetup,
        loginMFA,
        loginMFAOnly,
        isOwner,
        authActionLoading,
        disableMFA
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('steel_token');
      const storedUser = localStorage.getItem('steel_user');

      if (token && storedUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('steel_token');
            localStorage.removeItem('steel_user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          localStorage.removeItem('steel_token');
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
  const login = async (email, password, isOwner = false, redirectTo = '/home') => {
    try {
      setLoading(true);

      const endpoint = isOwner
        ? `${API_BASE_URL}/api/auth/owner-login`
        : `${API_BASE_URL}/api/auth/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('steel_token', data.token);
        localStorage.setItem('steel_user', JSON.stringify(data.user));

        setUser(data.user);
        setIsAuthenticated(true);

        toast.success(isOwner ? 'Owner login successful!' : 'Login successful!');
        navigate(redirectTo);

        return { success: true, user: data.user };
      } else {
        toast.error(data.error || 'Login failed');
        return { success: false };
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const register = async (userData, isOwner = false, redirectTo = null) => {
    try {
      setLoading(true);
      
      const endpoint = isOwner 
        ? `${API_BASE_URL}/api/auth/register-owner`
        : `${API_BASE_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('steel_token', data.token);
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
  const logout = () => {
    localStorage.removeItem('steel_token');
    localStorage.removeItem('steel_user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // TRIAL ACCESS CHECK
  const checkAccess = async (feature) => {
    try {
      if (user?.role === 'owner') return true;

      const token = localStorage.getItem('steel_token');

      const response = await fetch(`${API_BASE_URL}/api/trial/check-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
      const token = localStorage.getItem('steel_token');
      const response = await fetch(`${API_BASE_URL}/api/trial/status`, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = localStorage.getItem('steel_token');

      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
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
        verifyOTP,
        resetPassword,
        sendSignupOTP,
        verifySignupOTP,
        signup,
        isOwner
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';

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
  const login = async (email, password, isOwner = false) => {
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
        navigate('/home');

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
  const register = async (userData, isOwner = false) => {
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
        navigate(isOwner ? '/owner/dashboard' : '/dashboard');

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
        isOwner
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

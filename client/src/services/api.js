// client/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('steel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Security & Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      const { data, status } = response;

      // ── Handle Specific Security Flags from Backend ──
      
      // 1. Session Invalidation (Single-Session Enforcement)
      if (data.sessionKicked) {
        toast.error('Multiple sessions detected. You have been logged out.');
        handleGlobalLogout();
        return Promise.reject(error);
      }

      // 2. License Expired
      if (data.licenseExpired) {
        toast.error('Your license has expired. Please contact your administrator.');
        // Don't logout, just redirect to a limited state or show modal
        // window.location.href = '/license-expired';
        return Promise.reject(error);
      }

      // 3. License Inactive (Disabled by SuperAdmin)
      if (data.licenseInactive) {
        toast.error('Your account license is currently inactive.');
        handleGlobalLogout();
        return Promise.reject(error);
      }

      // 4. Standard 401 Unauthorized (Token expired/invalid)
      if (status === 401) {
        handleGlobalLogout();
        return Promise.reject(error);
      }

      // 5. 403 Forbidden (Insufficient Permissions)
      if (status === 403) {
        toast.error(data.error || 'Access denied.');
      }
    } else {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error);
  }
);

function handleGlobalLogout() {
  localStorage.removeItem('steel_token');
  localStorage.removeItem('steel_user');
  // Avoid loop if already on login
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

export default api;

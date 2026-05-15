// client/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

const API_URL = `${API_BASE_URL}/api/v1`.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request Interceptor: Enable credentials
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

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
      if (status === 401 && !error.config._retry && error.config.url !== '/auth/login' && error.config.url !== '/auth/refresh') {
        const originalRequest = error.config;
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        return new Promise(function (resolve, reject) {
          axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .then(() => {
              processQueue(null);
              resolve(api(originalRequest));
            })
            .catch((err) => {
              processQueue(err);
              handleGlobalLogout();
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
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
  localStorage.removeItem('steel_user');
  // W7 Fix: Use relative path to stay within the sub-directory (e.g., /misc/login)
  // Redirecting to '/login' (absolute) jumps to the root domain, which we must avoid.
  if (!window.location.pathname.includes('/login')) {
    const basePath = window.location.pathname.startsWith('/misc') ? '/misc' : '';
    window.location.href = `${basePath}/login`;
  }
}

export default api;


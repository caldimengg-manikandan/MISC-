// client/src/api/estimation.api.js
import axios from 'axios';

const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// Set default auth header if token exists
const getAuthHeaders = () => {
    const token = localStorage.getItem('steel_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const estimationApi = {
    getDashboardStats: () => axios.get(`${API_URL}/estimations/dashboard`, { headers: getAuthHeaders() }),
    getList: (params) => axios.get(`${API_URL}/estimations`, { params, headers: getAuthHeaders() }),
    getDetail: (id) => axios.get(`${API_URL}/estimations/${id}`, { headers: getAuthHeaders() }),
    create: (data) => axios.post(`${API_URL}/estimations`, data, { headers: getAuthHeaders() }),
    updateStatus: (id, action, data) => axios.put(`${API_URL}/estimations/${id}/${action}`, data, { headers: getAuthHeaders() }),
    saveData: (id, data) => axios.put(`${API_URL}/estimations/${id}`, data, { headers: getAuthHeaders() }),
    delete: (id) => axios.delete(`${API_URL}/estimations/${id}`, { headers: getAuthHeaders() }),
    duplicate: (id) => axios.post(`${API_URL}/estimations/${id}/duplicate`, {}, { headers: getAuthHeaders() }),
};

export default estimationApi;

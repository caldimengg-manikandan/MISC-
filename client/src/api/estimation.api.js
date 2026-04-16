// client/src/api/estimation.api.js
import axios from 'axios';

import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

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
    bulkDelete: (ids) => axios.post(`${API_URL}/estimations/bulk-delete-test`, { ids }, { headers: getAuthHeaders() }),
    duplicate: (id) => axios.post(`${API_URL}/estimations/${id}/duplicate`, {}, { headers: getAuthHeaders() }),
};

export default estimationApi;

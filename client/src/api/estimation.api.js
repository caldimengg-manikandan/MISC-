// client/src/api/estimation.api.js
import api from '../services/api';

const estimationApi = {
    getDashboardStats: () => api.get('/estimations/dashboard'),
    getList: (params) => api.get('/estimations', { params }),
    getDetail: (id) => api.get(`/estimations/${id}`),
    create: (data) => api.post('/estimations', data),
    updateStatus: (id, action, data) => api.put(`/estimations/${id}/${action}`, data),
    saveData: (id, data) => api.put(`/estimations/${id}`, data),
    delete: (id) => api.delete(`/estimations/${id}`),
    bulkDelete: (ids) => api.post('/estimations/bulk-delete-test', { ids }),
    duplicate: (id) => api.post(`/estimations/${id}/duplicate`, {}),
};

export default estimationApi;

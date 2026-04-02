import axios from 'axios';
import API_BASE_URL from '../config/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('steel_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const notesApi = {
  getProjectNotes: (projectId) => axios.get(`${API_BASE_URL}/api/notes/project/${projectId}`, { headers: getAuthHeaders() }),
  getTrashNotes: (projectId) => axios.get(`${API_BASE_URL}/api/notes/trash/${projectId}`, { headers: getAuthHeaders() }),
  createNote: (data) => axios.post(`${API_BASE_URL}/api/notes`, data, { headers: getAuthHeaders() }),
  updateNote: (id, data) => axios.put(`${API_BASE_URL}/api/notes/${id}`, data, { headers: getAuthHeaders() }),
  updatePosition: (id, pos) => axios.patch(`${API_BASE_URL}/api/notes/${id}/position`, pos, { headers: getAuthHeaders() }),
  restoreNote: (id) => axios.post(`${API_BASE_URL}/api/notes/restore/${id}`, {}, { headers: getAuthHeaders() }),
  deleteNote: (id) => axios.delete(`${API_BASE_URL}/api/notes/${id}`, { headers: getAuthHeaders() }),
  permanentlyDeleteNote: (id) => axios.delete(`${API_BASE_URL}/api/notes/${id}/permanent`, { headers: getAuthHeaders() })
};

export default notesApi;

// client/src/api/v1/notes.api.js
import api from '../services/api';

const notesApi = {
  getProjectNotes: (projectId) => api.get(`notes/project/${projectId}`),
  getTrashNotes: (projectId) => api.get(`notes/trash/${projectId}`),
  createNote: (data) => api.post('notes', data),
  updateNote: (id, data) => api.put(`notes/${id}`, data),
  updatePosition: (id, pos) => api.patch(`notes/${id}/position`, pos),
  restoreNote: (id) => api.post(`notes/restore/${id}`, {}),
  deleteNote: (id) => api.delete(`notes/${id}`),
  permanentlyDeleteNote: (id) => api.delete(`notes/${id}/permanent`)
};

export default notesApi;


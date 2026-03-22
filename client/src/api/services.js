import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
};

export const chatAPI = {
  createSession: (data) => api.post('/chat/create-session', data),
  getSessions: (agentType) => api.get('/chat/sessions', { params: { agentType } }),
  getSession: (id) => api.get(`/chat/session/${id}`),
  sendMessage: (data) => api.post('/chat/message', data),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents', formData),
  getDocuments: () => api.get('/documents'),
};

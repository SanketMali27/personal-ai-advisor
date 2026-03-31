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
  sendMessage: async (data) => {
    const response = await api.post('/chat/message', data);

    return {
      ...response,
      data: {
        ...response.data,
        reply: response.data?.reply || '',
        sources: Array.isArray(response.data?.sources) ? response.data.sources : [],
      },
    };
  },
  addSummaryMessage: (data) => api.post('/chat/summary-message', data),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents', formData),
  getDocuments: (domain) => api.get('/documents', { params: domain ? { domain } : {} }),
  summarize: (documentId) => api.post(`/documents/${documentId}/summarize`),
};

export const youtubeAPI = {
  process: (data) => api.post('/youtube/process', data),
  chat: async (data) => {
    const response = await api.post('/youtube/chat', data);

    return {
      ...response,
      data: {
        ...response.data,
        reply: response.data?.reply || '',
        sources: Array.isArray(response.data?.sources) ? response.data.sources : [],
      },
    };
  },
  history: () => api.get('/youtube/history'),
  getVideo: (videoId) => api.get(`/youtube/${videoId}`),
  deleteVideo: (videoId) => api.delete(`/youtube/${videoId}`),
};

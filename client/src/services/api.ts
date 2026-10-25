import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hogwarts_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hogwarts_token');
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  verifyEmail: (email: string) =>
    api.post('/auth/verify-email', { email }),
  resetPassword: (email: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, newPassword }),
};

// Sorting endpoints
export const sorting = {
  start: () => api.post('/sorting/start'),
  answer: (sessionId: string, answer: string) =>
    api.post('/sorting/answer', { sessionId, answer }),
  getResult: () => api.get('/sorting/result'),
};

// Schedule endpoints
export const schedule = {
  generate: (interests: string[]) =>
    api.post('/schedule/generate', { interests }),
  get: () => api.get('/schedule'),
};

// Letters (Owl Post) endpoints
export const letters = {
  send: (recipientUsername: string, subject: string, body: string, useMagicStyle?: boolean) =>
    api.post('/letters/send', { recipientUsername, subject, body, useMagicStyle }),
  getInbox: () => api.get('/letters/inbox'),
  getSent: () => api.get('/letters/sent'),
  markRead: (id: number) => api.patch(`/letters/${id}/read`),
  previewStyle: (body: string) => api.post('/letters/preview-style', { body }),
};

// Forum endpoints
export const forum = {
  getPosts: (houseName?: string) =>
    api.get('/forum/posts', { params: houseName ? { house: houseName } : {} }),
  createPost: (title: string, body: string) =>
    api.post('/forum/posts', { title, body }),
  getPost: (id: number) => api.get(`/forum/posts/${id}`),
  addComment: (postId: number, body: string) =>
    api.post(`/forum/posts/${postId}/comments`, { body }),
  upvote: (postId: number) => api.post(`/forum/posts/${postId}/upvote`),
};

// Leaderboard endpoints
export const leaderboard = {
  getHouses: () => api.get('/leaderboard/houses'),
  getUsers: () => api.get('/leaderboard/users'),
};

export default api;

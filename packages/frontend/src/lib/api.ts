import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string, nom: string, prenom: string) =>
    api.post('/auth/register', { email, password, nom, prenom }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Vehicle endpoints
export const vehicleAPI = {
  list: (filters?: any) => api.get('/vehicles', { params: filters }),
  get: (id: number) => api.get(`/vehicles/${id}`),
  search: (filters: any) => api.get('/vehicles/search', { params: filters }),
};

// Reservation endpoints
export const reservationAPI = {
  list: () => api.get('/reservations'),
  get: (id: number) => api.get(`/reservations/${id}`),
  create: (data: any) => api.post('/reservations', data),
  update: (id: number, data: any) => api.put(`/reservations/${id}`, data),
  cancel: (id: number) => api.post(`/reservations/${id}/cancel`),
};

// Payment endpoints
export const paymentAPI = {
  process: (reservationId: number, method: string) =>
    api.post('/payments', { reservationId, method }),
  verify: (paymentId: string) => api.get(`/payments/${paymentId}/verify`),
};

// User endpoints
export const userAPI = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/users/change-password', { oldPassword, newPassword }),
};

// Admin endpoints
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  reservations: () => api.get('/admin/reservations'),
  vehicles: () => api.get('/admin/vehicles'),
};

export default api;

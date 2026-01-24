import axios from 'axios';
import { toast } from 'react-toastify';

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://api-inventory.isavralabel.com/berkahexpress/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Set appropriate Content-Type
    if (config.data instanceof FormData) {
      // Let the browser set multipart/form-data with boundary
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'Terjadi kesalahan';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// User management endpoints
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserBalance: (id, amount, type) => api.put(`/users/${id}/balance`, { amount, type }),
};

// Price management endpoints
export const priceAPI = {
  getAllPrices: () => api.get('/prices'),
  getPriceByCountryAndCategory: (country, category) => api.get(`/prices/${country}/${category}`),
  createPrice: (priceData) => api.post('/prices', priceData),
  updatePrice: (id, priceData) => api.put(`/prices/${id}`, priceData),
  deletePrice: (id) => api.delete(`/prices/${id}`),
};

// Account management endpoints
export const accountAPI = {
  getAllAccounts: () => api.get('/accounts'),
  createAccount: (accountData) => api.post('/accounts', accountData),
  updateAccount: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
};

// Expedition management endpoints
export const expeditionAPI = {
  getAllExpeditions: () => api.get('/expeditions'),
  getAllExpeditionsAdmin: () => api.get('/expeditions/all'),
  createExpedition: (expeditionData) => api.post('/expeditions', expeditionData),
  updateExpedition: (id, expeditionData) => api.put(`/expeditions/${id}`, expeditionData),
  deleteExpedition: (id) => api.delete(`/expeditions/${id}`),
};

// Topup management endpoints
export const topupAPI = {
  getAllTopups: () => api.get('/topups'),
  createTopup: (topupData) => api.post('/topups', topupData),
  updateTopupStatus: (id, status) => api.put(`/topups/${id}/status`, { status }),
};

// Transaction management endpoints
export const transactionAPI = {
  getAllTransactions: (page = 1, limit = 10) => api.get(`/transactions?page=${page}&limit=${limit}`),
  getUserTransactions: (page = 1, limit = 10) => api.get(`/transactions/user?page=${page}&limit=${limit}`),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  updateTransactionStatus: (id, status) => api.put(`/transactions/${id}/status`, { status }),
  updateTransactionExpedition: (id, expeditionData) => api.put(`/transactions/${id}/expedition`, expeditionData),
  cancelTransaction: (id) => api.put(`/transactions/${id}/cancel`),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
};

// Tracking endpoints
export const trackingAPI = {
  getTrackingByResi: (resi) => api.get(`/tracking/${resi}`),
  addTrackingUpdate: (resi, trackingData) => api.post(`/tracking/${resi}`, trackingData),
  getTrackingUpdates: (resi) => api.get(`/tracking/${resi}/updates`),
  updateTrackingUpdate: (id, trackingData) => api.put(`/tracking/updates/${id}`, trackingData),
  deleteTrackingUpdate: (id) => api.delete(`/tracking/updates/${id}`),
  getAdminTransactions: (page = 1, limit = 10, search = '') => 
    api.get(`/tracking/admin/transactions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
};

export default api;
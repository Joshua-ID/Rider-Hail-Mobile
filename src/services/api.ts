import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  registerDriver: (data: any) => api.post('/auth/register-driver', data),
};

// Rides
export const ridesAPI = {
  estimate: (data: any) => api.post('/rides/estimate', data),
  create: (data: any) => api.post('/rides', data),
  get: (id: string) => api.get(`/rides/${id}`),
  accept: (id: string) => api.post(`/rides/${id}/accept`),
  updateStatus: (id: string, status: string) => api.patch(`/rides/${id}/status`, { status }),
  cancel: (id: string, reason?: string) => api.post(`/rides/${id}/cancel`, { reason }),
  history: (page = 1) => api.get(`/rides/history?page=${page}`),
  rate: (id: string, rating: number, comment?: string) => api.post(`/rides/${id}/rate`, { rating, comment }),
};

// Drivers
export const driversAPI = {
  getNearby: (lat: number, lng: number) => api.get(`/drivers/nearby?lat=${lat}&lng=${lng}`),
  getProfile: () => api.get('/drivers/me'),
  updateLocation: (lat: number, lng: number) => api.patch('/drivers/location', { lat, lng }),
  toggleOnline: (isOnline: boolean) => api.patch('/drivers/online-status', { isOnline }),
  getEarnings: () => api.get('/drivers/earnings'),
};

// Payments
export const paymentsAPI = {
  createIntent: (rideId: string) => api.post('/payments/create-intent', { rideId }),
  confirm: (rideId: string, paymentMethod?: string) => api.post('/payments/confirm', { rideId, paymentMethod }),
};

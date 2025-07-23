import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // You might want to dispatch a logout action here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    memberTier: string;
    role: string;
    qrCode?: string;
    profileImageUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  }

  static async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await api.post('/auth/register', userData);
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local tokens
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }
  }

  static async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    return accessToken;
  }

  static async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;

      // Verify token by making a request to protected endpoint
      await api.get('/auth/me');
      return true;
    } catch (error) {
      // Token is invalid or expired
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      return false;
    }
  }
}

export { api };
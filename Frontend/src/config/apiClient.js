import axios from 'axios';
import env from './env';
import { auth } from '@/config/firebase';

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Async interceptor to add Firebase token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Firebase token added to request');
      } else {
        console.log('[API] No Firebase user, request will be unauthenticated');
      }
    } catch (error) {
      console.error('[API] Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

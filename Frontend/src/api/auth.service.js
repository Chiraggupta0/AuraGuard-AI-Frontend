import apiClient from '@/config/apiClient';

export const login = (payload) => apiClient.post('/auth/login', payload);
export const register = (payload) => apiClient.post('/auth/register', payload);
export const fetchCurrentUser = () => apiClient.get('/auth/me');

import apiClient from '@/config/apiClient';

export const fetchSettings = () => apiClient.get('/settings');
export const updateSettings = (payload) => apiClient.put('/settings', payload);

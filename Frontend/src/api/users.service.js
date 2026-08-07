import apiClient from '@/config/apiClient';

export const fetchUsers = () => apiClient.get('/users');
export const updateUserProfile = (payload) => apiClient.put('/users/profile', payload);

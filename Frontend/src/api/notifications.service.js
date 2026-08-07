import apiClient from '@/config/apiClient';

export const fetchNotifications = () => apiClient.get('/notifications');
export const markNotificationRead = (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`);

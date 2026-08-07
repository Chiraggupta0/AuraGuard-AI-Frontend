import apiClient from '@/config/apiClient';

export const fetchAlerts = () => apiClient.get('/monitoring/alerts');
export const fetchDetectionSummary = () => apiClient.get('/monitoring/summary');

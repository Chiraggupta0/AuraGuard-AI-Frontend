import apiClient from '@/config/apiClient';

export const fetchReports = () => apiClient.get('/reports');
export const fetchReportById = (reportId) => apiClient.get(`/reports/${reportId}`);

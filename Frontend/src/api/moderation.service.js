import apiClient from '@/config/apiClient';

export const fetchModerationQueue = () => apiClient.get('/moderation/queue');
export const resolveModerationCase = (caseId, payload) => apiClient.post(`/moderation/${caseId}/resolve`, payload);

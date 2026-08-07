import apiClient from '@/config/apiClient';

export const fetchMeetings = () => apiClient.get('/meetings');
export const fetchMeetingById = (meetingId) => apiClient.get(`/meetings/${meetingId}`);
export const joinMeeting = (meetingId) => apiClient.post(`/meetings/${meetingId}/join`);

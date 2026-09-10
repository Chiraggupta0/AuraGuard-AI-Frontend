import apiClient from '@/config/apiClient';

// Mute/remove are REST-only (no socket event) since they trigger a LiveKit
// Server SDK call on the backend — see
// AuraGuard-AI-Backend/src/modules/meetingSafety/violationEngine.controller.js.
// Reuses the same authenticated apiClient as roomApi.js (Firebase token
// interceptor already attached there).
export const muteViolatingParticipant = (roomCode, violationId) =>
  apiClient.post(`/rooms/${roomCode}/violations/${violationId}/mute`).then((res) => res.data.data);

export const removeViolatingParticipant = (roomCode, violationId) =>
  apiClient.post(`/rooms/${roomCode}/violations/${violationId}/remove`).then((res) => res.data.data);

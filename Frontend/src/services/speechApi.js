import axios from 'axios';
import env from '@/config/env';

// Talks directly to the Python speech microservice (Phase 4) — a different
// origin from the Node backend (`apiClient`), and currently unauthenticated
// (the Python service has no auth middleware), so this is a standalone
// client rather than reusing apiClient's Firebase-token interceptor.
const speechClient = axios.create({
  baseURL: env.speechServiceUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is "data:<mime>;base64,<data>" — the API only wants
      // the data portion.
      const base64 = String(reader.result).split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Matches the Python service's actual contract exactly:
// POST /api/v1/analyze/audio { meetingId, userId, audio: base64 }
// -> SpeechDetectionResult (see AuraGuard-AI-Python/speech/schemas.py)
export const analyzeAudioChunk = async ({ meetingId, userId, audioBlob }) => {
  const audio = await blobToBase64(audioBlob);
  const response = await speechClient.post('/api/v1/analyze/audio', {
    meetingId,
    userId,
    audio,
  });
  return response.data;
};

import visionApiClient from '@/config/visionApiClient';

// Matches the existing Python /detect contract exactly: multipart/form-data
// with a `file` field (see AuraGuard-AI-Python/app/api/detect.py). The
// Content-Type header is left for axios to set itself, so it includes the
// multipart boundary.
export async function detectFrame(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'frame.jpg');

  const response = await visionApiClient.post('/detect', formData);
  return response.data;
}

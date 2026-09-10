const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'AuraGuard AI',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  // Python vision service (Ultralytics YOLO), called directly from the
  // browser — see src/services/visionApi.js. Dropped by a bad merge
  // resolution at one point; restored here.
  visionServiceUrl: import.meta.env.VITE_VISION_SERVICE_URL ?? 'http://localhost:8000',
  // Python speech microservice — a different server from apiBaseUrl (the
  // Node backend). See src/services/speechApi.js.
  // 8001, not 8000 — visionServiceUrl above already runs on 8000 and both
  // must be reachable at the same time.
  speechServiceUrl: import.meta.env.VITE_SPEECH_SERVICE_URL ?? 'http://localhost:8001',
  speechChunkIntervalMs: Number(import.meta.env.VITE_SPEECH_CHUNK_INTERVAL_MS) || 5000,
};

export default env;

const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'AuraGuard AI',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  // Python speech microservice — a different server from apiBaseUrl (the
  // Node backend). See src/services/speechApi.js.
  speechServiceUrl: import.meta.env.VITE_SPEECH_SERVICE_URL ?? 'http://localhost:8000',
  speechChunkIntervalMs: Number(import.meta.env.VITE_SPEECH_CHUNK_INTERVAL_MS) || 5000,
};

export default env;

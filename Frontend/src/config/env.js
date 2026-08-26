const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'AuraGuard AI',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  // Python vision service (Ultralytics YOLO), called directly from the
  // browser for this proof-of-concept — see src/services/visionApi.js.
  visionServiceUrl: import.meta.env.VITE_VISION_SERVICE_URL ?? 'http://localhost:8000',
};

export default env;

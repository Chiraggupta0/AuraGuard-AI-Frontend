const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'AuraGuard AI',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
};

export default env;

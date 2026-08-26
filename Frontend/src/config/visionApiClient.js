import axios from 'axios';
import env from './env';

// Separate from apiClient.js on purpose: the Python vision service is a
// different backend with its own CORS policy (allow_origins: ["*"]), which
// is incompatible with axios's `withCredentials: true`, and it needs no
// Firebase auth token — apiClient's interceptor would only attach one it
// can't use.
const visionApiClient = axios.create({
  baseURL: env.visionServiceUrl,
});

export default visionApiClient;

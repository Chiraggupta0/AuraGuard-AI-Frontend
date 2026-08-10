import apiClient from '@/config/apiClient';

// Create a new room (authenticated)
export const createRoom = async (displayName) => {
  try {
    const response = await apiClient.post('/rooms/create', { displayName });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login first.');
    }
    throw error;
  }
};

// Join an existing room (authenticated)
export const joinRoom = async (roomCode, displayName) => {
  try {
    const response = await apiClient.post('/rooms/join', { roomCode, displayName });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login first.');
    }
    throw error;
  }
};

// Validate room exists (authenticated)
export const validateRoom = async (roomCode) => {
  try {
    const response = await apiClient.get(`/rooms/validate/${roomCode}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login first.');
    }
    throw error;
  }
};

// Legacy endpoint - generates token with any room (for backward compatibility)
export const getRoomToken = (roomName, displayName) =>
  apiClient.post('/rooms/token', { roomName, displayName });

export const getToken = async (roomName, displayName) => {
  const response = await getRoomToken(roomName, displayName);
  return response.data.data;
};

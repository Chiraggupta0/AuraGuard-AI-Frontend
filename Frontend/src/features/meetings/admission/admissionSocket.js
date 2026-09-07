import { io } from 'socket.io-client';
import env from '@/config/env';
import { auth } from '@/config/firebase';

// Dedicated Socket.IO client for the '/admission' namespace (room-admission /
// "knock to enter" feature). Kept separate from src/config/socketClient.js,
// which is unused elsewhere in the app and carries no auth token — this flow
// needs a live Firebase ID token in the handshake, matching how apiClient.js
// authenticates REST calls to the Rooms module.
const socket = io(`${env.socketUrl}/admission`, {
  autoConnect: false,
  transports: ['websocket'],
  withCredentials: true,
});

// Resolves once connected (fetching a fresh Firebase token first). Safe to
// call repeatedly — a no-op if already connected.
export const connectAdmissionSocket = async () => {
  if (socket.connected) return socket;

  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  const token = await user.getIdToken();
  socket.auth = { token };

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      socket.off('connect_error', onError);
      resolve(socket);
    };
    const onError = (error) => {
      socket.off('connect', onConnect);
      reject(error);
    };
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
    socket.connect();
  });
};

export const disconnectAdmissionSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;

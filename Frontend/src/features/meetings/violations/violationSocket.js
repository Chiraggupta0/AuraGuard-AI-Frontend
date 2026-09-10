import { io } from 'socket.io-client';
import env from '@/config/env';
import { auth } from '@/config/firebase';

// Dedicated Socket.IO client for the '/violations' namespace (AI Violation
// Engine). Mirrors features/meetings/admission/admissionSocket.js exactly —
// a separate connection rather than importing that file, to keep this
// feature isolated from the already-verified admission workstream.
const socket = io(`${env.socketUrl}/violations`, {
  autoConnect: false,
  transports: ['websocket'],
  withCredentials: true,
});

export const connectViolationSocket = async () => {
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

export default socket;

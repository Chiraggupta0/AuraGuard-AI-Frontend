import { io } from 'socket.io-client';
import env from './env';

const socket = io(env.socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;

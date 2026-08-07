import socket, { connectSocket, disconnectSocket } from '@/config/socketClient';

export default function useSocket() {
  return {
    socket,
    connectSocket,
    disconnectSocket,
  };
}

import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

const getSocketServerUrl = (): string => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const token = localStorage.getItem('token');
    const serverUrl = getSocketServerUrl();
    socketInstance = io(serverUrl, {
      autoConnect: false,
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
};

export const connectSocket = (token?: string) => {
  const socket = getSocket();
  if (token) {
    socket.auth = { token };
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};

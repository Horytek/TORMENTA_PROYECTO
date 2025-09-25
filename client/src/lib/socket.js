import { io } from 'socket.io-client';

// Usa el mismo origen donde corre el backend (sirve en prod y en dev si se accede por el backend)
const URL = typeof window !== 'undefined' ? window.location.origin : undefined;

export const socket = io(URL, {
  autoConnect: true,
  withCredentials: true,
});

export default socket;


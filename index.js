import app from './src/app.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const main = () => {
  let server;
  let io;

  try {
    server = createServer(app);

    // Socket.IO signaling server
    io = new SocketIOServer(server, {
      cors: {
        origin: true,
        credentials: true,
      },
    });

    // In-memory presence map
    const userSockets = new Map(); // userId -> Set(socketId)
    const socketUsers = new Map(); // socketId -> userId

    const addUserSocket = (userId, socketId) => {
      if (!userId) return;
      const set = userSockets.get(userId) || new Set();
      set.add(socketId);
      userSockets.set(userId, set);
      socketUsers.set(socketId, userId);
    };

    const removeSocket = (socketId) => {
      const userId = socketUsers.get(socketId);
      if (!userId) return;
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socketId);
        if (set.size === 0) userSockets.delete(userId);
      }
      socketUsers.delete(socketId);
    };

    const emitToUser = (userId, event, payload) => {
      const set = userSockets.get(userId);
      if (!set) return;
      for (const sid of set) io.to(sid).emit(event, payload);
    };

    io.on('connection', (socket) => {
      socket.on('register', (userId) => {
        addUserSocket(String(userId), socket.id);
      });

      socket.on('disconnect', () => {
        removeSocket(socket.id);
      });

      socket.on('call:offer', ({ to, from, sdp, callType }) => {
        emitToUser(String(to), 'call:offer', { from: String(from), sdp, callType });
      });

      socket.on('call:answer', ({ to, from, sdp }) => {
        emitToUser(String(to), 'call:answer', { from: String(from), sdp });
      });

      socket.on('call:candidate', ({ to, from, candidate }) => {
        emitToUser(String(to), 'call:candidate', { from: String(from), candidate });
      });

      socket.on('call:end', ({ to, from }) => {
        emitToUser(String(to), 'call:end', { from: String(from) });
      });
    });

    server.listen(app.get('port'), '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${app.get('port')}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`El puerto ${app.get('port')} ya está en uso.`);
      } else {
        console.error('Error al iniciar el servidor:', err);
      }
      process.exit(1);
    });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (error) => {
      console.error('Error no capturado:', error);
      gracefulShutdown();
    });

    function gracefulShutdown() {
      server.close(() => {
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Cierre forzado después de timeout');
        process.exit(1);
      }, 10000);
    }
  } catch (error) {
    console.error('Error fatal al iniciar la aplicación:', error);
    process.exit(1);
  }
};

main();


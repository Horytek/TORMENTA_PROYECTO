import app from './src/app.js';
import { createServer } from 'http';

/**
 * Punto de entrada del proceso web.
 *
 * Antes montaba un servidor de Socket.IO con la señalización de llamadas
 * (`call:offer`, `call:answer`, `call:candidate`, `call:end`) y un mapa de
 * presencia en memoria. Se removió: ningún frontend lo consumía —`client-v2` ni
 * siquiera tenía `socket.io-client` instalado, y en `client` el módulo que abría
 * la conexión no lo importaba nadie—, y en producción `/socket.io/` respondía
 * 404. Era plomería sin grifo.
 *
 * La consecuencia importante es de arquitectura: al no haber estado en memoria,
 * este proceso pasó a ser apto para correr en varias instancias. Lo único que
 * todavía lo ata a una sola son los crons, que arrancan desde `app.js` y deberían
 * mudarse a un worker aparte.
 */
const main = () => {
  let server;

  try {
    server = createServer(app);

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

import app from './src/app.js';

const port = process.env.PORT || 8080;

const main = () => {
    let server;
    
    try {
        server = app.listen(port, '0.0.0.0', () => {
            console.log(`Servidor escuchando en el puerto ${port}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ El puerto ${port} ya está en uso. Intenta con otro puerto o libera el actual.`);
            } else {
                console.error('❌ Error al iniciar el servidor:', err);
            }
            process.exit(1); 
        });

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        
        process.on('uncaughtException', (error) => {
            console.error('❌ Error no capturado:', error);
            gracefulShutdown();
        });
        
        function gracefulShutdown() {
            server.close(() => {
                process.exit(0);
            });
            
            setTimeout(() => {
                console.error('⚠️ Cierre forzado después de timeout');
                process.exit(1);
            }, 10000);
        }
    } catch (error) {
        console.error('❌ Error fatal al iniciar la aplicación:', error);
        process.exit(1);
    }
};

main();
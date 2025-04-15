import app from './src/app.js';

const main = () => {
    let server;
    
    try {
        server = app.listen(app.get('port'), '0.0.0.0', () => {
            console.log(`✅ Servidor corriendo en http://0.0.0.0:${app.get('port')}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ El puerto ${app.get('port')} ya está en uso. Intenta con otro puerto o libera el actual.`);
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
            console.log('🛑 Cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
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
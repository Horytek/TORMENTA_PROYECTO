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
            // Log específico para el error de path-to-regexp
            if (error.message && error.message.includes('Missing parameter name')) {
                console.error('🔍 Error de ruta Express detectado - verifica que no uses URLs completas como rutas');
                console.error('🔍 Stack trace:', error.stack);
            }
            gracefulShutdown();
        });
        
        function gracefulShutdown() {
            //console.log('🛑 Cerrando servidor...');
            server.close(() => {
                //console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
            
            setTimeout(() => {
                console.error('⚠️ Cierre forzado después de timeout');
                process.exit(1);
            }, 10000);
        }
    } catch (error) {
        console.error('❌ Error fatal al iniciar la aplicación:', error);
        // Log específico para errores de Express/path-to-regexp
        if (error.message && error.message.includes('Missing parameter name')) {
            console.error('🔍 Error de Express: Una ruta contiene una URL completa en lugar de un path');
            console.error('🔍 Revisa que todas las rutas empiecen con "/" y no con "http://" o "https://"');
            console.error('🔍 Stack trace:', error.stack);
        }
        process.exit(1);
    }
};

main();
// Script de diagnóstico para el sistema de logs
import { getConnection } from "./src/database/database.js";
import { registrarLog, LOG_ACTIONS, MODULOS } from "./src/utils/logActions.js";

async function testLogSystem() {
    //console.log('🔍 Iniciando diagnóstico del sistema de logs...\n');

    let connection;
    try {
        connection = await getConnection();
        //console.log('✅ Conexión a base de datos establecida');

        // 1. Verificar si existe la tabla log_sistema
        //console.log('\n📋 Verificando estructura de tabla log_sistema...');
        const [tableInfo] = await connection.query(`
            DESCRIBE log_sistema
        `);
        //console.log('Columnas de log_sistema:', tableInfo.map(col => col.Field));

        // 2. Verificar logs recientes
        //console.log('\n📊 Últimos 5 logs en la base de datos:');
        const [recentLogs] = await connection.query(`
            SELECT id_log, accion, id_usuario, descripcion, fecha, ip
            FROM log_sistema 
            ORDER BY fecha DESC 
            LIMIT 5
        `);
        //console.table(recentLogs);

        // 3. Probar registrar un log directamente
        //console.log('\n🧪 Probando registrar log directamente...');
        const testLogData = {
            accion: LOG_ACTIONS.CLIENTE_CREAR,
            id_modulo: MODULOS.CLIENTES,
            id_usuario: 1, // Usuario de prueba
            recurso: 'cliente_id:999',
            descripcion: 'Test de log directo desde diagnóstico',
            ip: '127.0.0.1',
            id_tenant: 1
        };

        //console.log('Datos del log de prueba:', testLogData);

        try {
            await registrarLog(testLogData);
            //console.log('✅ Log registrado exitosamente');

            // Verificar que se insertó
            const [newLog] = await connection.query(`
                SELECT * FROM log_sistema 
                WHERE descripcion = ? 
                ORDER BY fecha DESC 
                LIMIT 1
            `, [testLogData.descripcion]);

            if (newLog.length > 0) {
                //console.log('✅ Log encontrado en la base de datos:', newLog[0]);
            } else {
                //console.log('❌ Log no encontrado en la base de datos');
            }
        } catch (error) {
            //console.error('❌ Error registrando log:', error);
        }

        // 4. Verificar LOG_ACTIONS
        //console.log('\n🔧 Verificando constantes LOG_ACTIONS:');
        //console.log('CLIENTE_CREAR:', LOG_ACTIONS.CLIENTE_CREAR);
        //console.log('CLIENTE_EDITAR:', LOG_ACTIONS.CLIENTE_EDITAR);
        //console.log('LOGIN_OK:', LOG_ACTIONS.LOGIN_OK);

        //console.log('\n🔧 Verificando constantes MODULOS:');
        //console.log('CLIENTES:', MODULOS.CLIENTES);
        //console.log('AUTH:', MODULOS.AUTH);

    } catch (error) {
        //console.error('❌ Error en diagnóstico:', error);
    } finally {
        if (connection) connection.release();
        //console.log('\n🏁 Diagnóstico completado');
    }
}

// Ejecutar diagnóstico
testLogSystem().catch(console.error);

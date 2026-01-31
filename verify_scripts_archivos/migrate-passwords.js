/**
 * Script de migración para hashear contraseñas existentes en texto plano
 * 
 * IMPORTANTE: Ejecutar UNA SOLA VEZ antes de poner en producción
 * 
 * USO:
 *   npm install bcryptjs
 *   node migrate-passwords.js
 */

import { getConnection } from "../src/database/database.js";
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

async function migratePasswords() {
    let connection;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    try {
        console.log('🔐 Iniciando migración de contraseñas...\n');
        
        connection = await getConnection();
        
        // Obtener todos los usuarios con sus contraseñas
        const [usuarios] = await connection.query(
            'SELECT id_usuario, usua, contra FROM usuario WHERE estado_usuario = 1'
        );
        
        console.log(`📊 Total de usuarios activos: ${usuarios.length}\n`);
        
        await connection.beginTransaction();
        
        for (const usuario of usuarios) {
            try {
                const { id_usuario, usua, contra } = usuario;
                
                // Verificar si ya está hasheada con bcrypt
                if (/^\$2[aby]\$\d{2}\$.{53}$/.test(contra)) {
                    console.log(`⏭️  ${usua}: Ya tiene contraseña hasheada (skip)`);
                    skipped++;
                    continue;
                }
                
                // Hashear la contraseña en texto plano
                const hashedPassword = await bcrypt.hash(contra, SALT_ROUNDS);
                
                // Actualizar en la base de datos
                await connection.query(
                    'UPDATE usuario SET contra = ? WHERE id_usuario = ?',
                    [hashedPassword, id_usuario]
                );
                
                console.log(`✅ ${usua}: Contraseña hasheada exitosamente`);
                migrated++;
                
            } catch (error) {
                console.error(`❌ ${usuario.usua}: Error al hashear contraseña:`, error.message);
                errors++;
            }
        }
        
        await connection.commit();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN DE MIGRACIÓN:');
        console.log('='.repeat(50));
        console.log(`✅ Migradas:  ${migrated}`);
        console.log(`⏭️  Omitidas:  ${skipped}`);
        console.log(`❌ Errores:   ${errors}`);
        console.log(`📊 Total:     ${usuarios.length}`);
        console.log('='.repeat(50));
        
        if (migrated > 0) {
            console.log('\n✅ Migración completada exitosamente');
            console.log('⚠️  IMPORTANTE: Las contraseñas ahora están hasheadas con bcrypt');
            console.log('⚠️  Los usuarios deben usar sus contraseñas actuales para login');
        } else {
            console.log('\n⏭️  No se migró ninguna contraseña (todas ya están hasheadas)');
        }
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('\n❌ Error fatal en la migración:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Confirmación de seguridad
console.log('⚠️  ADVERTENCIA: Este script migrará todas las contraseñas a bcrypt');
console.log('⚠️  Solo debe ejecutarse UNA VEZ\n');
console.log('Continuando en 3 segundos...\n');

setTimeout(() => {
    migratePasswords()
        .then(() => {
            console.log('\n✅ Script finalizado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error:', error);
            process.exit(1);
        });
}, 3000);


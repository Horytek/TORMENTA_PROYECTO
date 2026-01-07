import { getConnection } from '../src/database/database.js';
import { DATABASE } from '../src/config.js';

async function runMigration() {
    let connection;
    try {
        console.log('Starting migration 003: Dynamic Actions...');
        connection = await getConnection();
        // Since getConnection returns a connection from pool, we can use it.
        // It's already connected.

        await connection.beginTransaction();

        // 1. Create permission_action_catalog table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS permission_action_catalog (
                id_action INT AUTO_INCREMENT PRIMARY KEY,
                action_key VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createTableQuery);
        console.log('Created permission_action_catalog table.');

        // 2. Add actions_json to permisos table if not exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${DATABASE}' 
            AND TABLE_NAME = 'permisos' 
            AND COLUMN_NAME = 'actions_json';
        `);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE permisos 
                ADD COLUMN actions_json JSON DEFAULT NULL
            `);
            console.log('Added actions_json column to permisos table.');
        } else {
            console.log('actions_json column already exists.');
        }

        await connection.commit();
        console.log('Migration 003 completed successfully.');
        process.exit(0);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

runMigration();

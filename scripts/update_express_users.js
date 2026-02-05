import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { ca: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined }
};

async function main() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.changeUser({ database: 'express_db' });

        console.log('Creating express_users table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS express_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id CHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'cashier') DEFAULT 'cashier',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_user (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

        console.log('✅ express_users table created.');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

main();

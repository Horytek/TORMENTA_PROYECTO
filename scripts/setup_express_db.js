import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        // Handle the multi-line certificate string correctly
        ca: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined
    }
};

async function main() {
    let connection;
    try {
        console.log('Connecting to MySQL server...');
        // Connect without selecting a database initially to allow creation
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // Create Database
        console.log('Creating database express_db if not exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS express_db;');

        // Switch to express_db
        console.log('Switching to express_db...');
        await connection.changeUser({ database: 'express_db' });

        // 1. Create Tenants Table
        console.log('Creating express_tenants table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS express_tenants (
        tenant_id CHAR(36) PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

        // 2. Create Products Table
        console.log('Creating express_products table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS express_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id CHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

        // 3. Create Sales Table
        console.log('Creating express_sales table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS express_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id CHAR(36) NOT NULL,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

        // 4. Create Sale Items Table
        console.log('Creating express_sale_items table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS express_sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        FOREIGN KEY (sale_id) REFERENCES express_sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES express_products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

        console.log('✅ Setup complete: express_db and tables created successfully.');
    } catch (error) {
        console.error('❌ Error during setup:', error);
    } finally {
        if (connection) await connection.end();
    }
}

main();

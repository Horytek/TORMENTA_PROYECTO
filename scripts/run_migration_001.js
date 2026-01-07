import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('📂 Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations', '001_sprint1_security.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Executing migration...');

        // Execute line by line or split by semicolon to handle errors gracefully if columns exist
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            try {
                await connection.query(statement);
                console.log('✅ Statement executed successfully');
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️ Column already exists, skipping...');
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️ Table already exists, skipping...');
                } else {
                    console.error('❌ Error executing statement:', err.message);
                    // Don't throw, try next statement (e.g., table creation vs alter)
                }
            }
        }

        console.log('🏁 Migration completed.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();

import { getConnection } from "../src/database/database.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await getConnection();

        console.log('📂 Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations', '002_sprint2_plan_templates.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Executing migration...');

        // Execute line by line logic is fragile for complex Create Table with constraints.
        // Better to split by valid semicolon not inside quotes, but for these specific CREATE TABLEs, simple split is OK.
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            try {
                await connection.query(statement);
                console.log('✅ Statement executed');
            } catch (err) {
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️ Table already exists, skipping...');
                } else {
                    console.error('❌ Error executing statement:', err.message);
                }
            }
        }

        console.log('🏁 Migration completed.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        if (connection) connection.release();
    }
}

runMigration();

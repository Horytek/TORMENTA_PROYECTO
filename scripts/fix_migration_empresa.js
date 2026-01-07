import { getConnection } from "../src/database/database.js";

async function fixMigration() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await getConnection();

        console.log('🛠 Attempting to add columns to "empresa"...');

        // 1. tenant_status
        try {
            await connection.query(`
                ALTER TABLE empresa 
                ADD COLUMN tenant_status ENUM('ACTIVE', 'SUSPENDED', 'GRACE') NOT NULL DEFAULT 'ACTIVE'
            `);
            console.log('✅ Added tenant_status');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ tenant_status already exists');
            else console.error('❌ Error adding tenant_status:', e.message);
        }

        // 2. grace_until
        try {
            await connection.query(`
                ALTER TABLE empresa 
                ADD COLUMN grace_until DATETIME NULL
            `);
            console.log('✅ Added grace_until');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ grace_until already exists');
            else console.error('❌ Error adding grace_until:', e.message);
        }

        // 3. perm_version
        try {
            await connection.query(`
                ALTER TABLE empresa 
                ADD COLUMN perm_version INT NOT NULL DEFAULT 1
            `);
            console.log('✅ Added perm_version');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ perm_version already exists');
            else console.error('❌ Error adding perm_version:', e.message);
        }

        console.log('🏁 Fix attempt completed.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixMigration();

import { getConnection } from "../src/database/database.js";

async function verifyMigration() {
    let connection;
    try {
        console.log("🔌 Connecting to DB for verification...");
        connection = await getConnection();

        // 1. Check columns in empresa
        const [empresaCols] = await connection.query("SHOW COLUMNS FROM empresa LIKE 'tenant_status'");
        const [empresaGrace] = await connection.query("SHOW COLUMNS FROM empresa LIKE 'grace_until'");
        const [empresaPerm] = await connection.query("SHOW COLUMNS FROM empresa LIKE 'perm_version'");

        if (empresaCols.length && empresaGrace.length && empresaPerm.length) {
            console.log("✅ Table 'empresa' has new columns: tenant_status, grace_until, perm_version");
        } else {
            console.error("❌ Missing columns in 'empresa' table!");
        }

        // 2. Check audit_log existence
        const [auditTable] = await connection.query("SHOW TABLES LIKE 'audit_log'");
        if (auditTable.length) {
            console.log("✅ Table 'audit_log' exists");
        } else {
            console.error("❌ Table 'audit_log' does NOT exist!");
        }

        console.log("🏁 Verification done.");

    } catch (error) {
        console.error("❌ Verification failed:", error);
    } finally {
        if (connection) connection.release();
    }
}

verifyMigration();

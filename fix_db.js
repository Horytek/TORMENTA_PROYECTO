import { getExpressConnection } from "./src/database/express_db.js";

async function run() {
    const connection = await getExpressConnection();

    // Helper to add column if not exists
    const addCol = async (colDef) => {
        try {
            await connection.query(`ALTER TABLE express_tenants ADD COLUMN ${colDef}`);
            console.log(`Added: ${colDef}`);
        } catch (e) {
            // Ignore "Duplicate column name" error (code 1060)
            if (e.errno === 1060) {
                console.log(`Column already exists: ${colDef.split(' ')[0]}`);
            } else {
                console.error(`Error adding ${colDef}:`, e.message);
            }
        }
    };

    await addCol("subscription_status VARCHAR(50) DEFAULT 'pending'");
    await addCol("subscription_end_date DATETIME NULL");
    await addCol("plan_id INT NULL");

    console.log("Schema update check complete.");
    connection.release();
    process.exit();
}

run();

import { getExpressConnection } from "../src/database/express_db.js";

async function activateAll() {
    let connection;
    try {
        connection = await getExpressConnection();
        console.log("Activating subscriptions...");

        // Set all to active, Monthly plan (id=3), expires in 30 days
        await connection.query(`
            UPDATE express_tenants 
            SET subscription_status = 'active', 
                plan_id = 3, 
                subscription_end_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
        `);

        console.log("All tenants activated.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

activateAll();

import { getExpressConnection } from "../src/database/express_db.js";

async function checkStatus() {
    let connection;
    try {
        connection = await getExpressConnection();
        console.log("Checking Tenant Status...");

        // Get the most recently created tenant or all tenants
        const [tenants] = await connection.query("SELECT tenant_id, business_name, email, subscription_status, subscription_end_date FROM express_tenants ORDER BY created_at DESC LIMIT 5");

        console.table(tenants);

        if (tenants.length > 0) {
            const t = tenants[0];
            console.log(`\nTenant: ${t.business_name}`);
            console.log(`Status: ${t.subscription_status}`);
            console.log(`End Date: ${t.subscription_end_date}`);

            const now = new Date();
            const end = t.subscription_end_date ? new Date(t.subscription_end_date) : null;
            console.log(`Now: ${now}`);
            console.log(`Expired?: ${!end || end < now}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkStatus();

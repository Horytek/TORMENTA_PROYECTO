/**
 * Subscription Cron Job
 * Runs daily to:
 * 1. Mark expired subscriptions as 'expired'
 * 2. Deactivate all users belonging to expired tenants
 */

import { getExpressConnection } from "../database/express_db.js";
import cron from "node-cron";

async function processExpiredSubscriptions() {
    let connection;
    try {
        connection = await getExpressConnection();

        // 1. Find tenants with expired subscriptions that are still marked 'active'
        const [expiredTenants] = await connection.query(`
            SELECT tenant_id, business_name, email 
            FROM express_tenants 
            WHERE subscription_status = 'active' 
            AND subscription_end_date IS NOT NULL 
            AND subscription_end_date < NOW()
        `);

        if (expiredTenants.length === 0) {
            console.log("[Cron] No expired subscriptions found.");
            return;
        }

        console.log(`[Cron] Found ${expiredTenants.length} expired subscription(s)`);

        for (const tenant of expiredTenants) {
            try {
                // 2. Update tenant subscription status to 'expired'
                await connection.query(
                    "UPDATE express_tenants SET subscription_status = 'expired' WHERE tenant_id = ?",
                    [tenant.tenant_id]
                );

                // 3. Deactivate all users for this tenant
                const [result] = await connection.query(
                    "UPDATE express_users SET status = 0 WHERE tenant_id = ?",
                    [tenant.tenant_id]
                );

                console.log(`[Cron] Tenant ${tenant.business_name} (${tenant.tenant_id}): marked expired, ${result.affectedRows} user(s) deactivated`);

                // 4. Create notification for the tenant
                await connection.query(
                    "INSERT INTO express_notifications (tenant_id, type, message) VALUES (?, ?, ?)",
                    [tenant.tenant_id, 'subscription', 'Tu suscripción ha expirado. Renueva tu plan para continuar usando Pocket POS.']
                );

            } catch (tenantError) {
                console.error(`[Cron] Error processing tenant ${tenant.tenant_id}:`, tenantError.message);
            }
        }

        console.log("[Cron] Expired subscriptions processing completed.");

    } catch (error) {
        console.error("[Cron] Error in subscription cron job:", error.message);
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Initialize the cron job
 * Runs every day at 00:05 AM (5 minutes past midnight)
 */
export function initSubscriptionCron() {
    // Run at 00:05 every day
    cron.schedule("5 0 * * *", async () => {
        console.log("[Cron] Starting daily subscription check...");
        await processExpiredSubscriptions();
    });

    console.log("[Cron] Subscription expiration cron job scheduled (runs daily at 00:05)");
}

// Export for manual testing
export { processExpiredSubscriptions };

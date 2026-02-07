import { getExpressConnection } from "../database/express_db.js";
import { randomUUID } from "crypto";

// --- SUBSCRIPTIONS ---

export const getPlans = async (req, res) => {
    let connection;
    try {
        connection = await getExpressConnection();
        const [plans] = await connection.query("SELECT * FROM express_plans ORDER BY price ASC");
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const getSubscriptionStatus = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();
        const [rows] = await connection.query(
            `SELECT t.business_name, t.subscription_status, t.subscription_end_date, t.plan_id, p.name as plan_name 
             FROM express_tenants t 
             LEFT JOIN express_plans p ON t.plan_id = p.id 
             WHERE t.tenant_id = ?`,
            [tenantId]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Tenant not found" });

        let tenant = rows[0];

        // --- ENFORCE DEFAULT 'EXPRESS' (Mensual) PLAN FOR EXISTING USERS ---
        if (!tenant.plan_id) {
            const defaultPlanId = 3; // Mensual => "Express"
            const duration = 30;
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + duration);

            await connection.query(
                `UPDATE express_tenants 
                 SET plan_id = ?, subscription_status = 'active', subscription_end_date = ? 
                 WHERE tenant_id = ?`,
                [defaultPlanId, newEndDate, tenantId]
            );

            // Fetch again to get clean data with joined plan name
            const [updatedRows] = await connection.query(
                `SELECT t.business_name, t.subscription_status, t.subscription_end_date, p.name as plan_name 
                 FROM express_tenants t 
                 LEFT JOIN express_plans p ON t.plan_id = p.id 
                 WHERE t.tenant_id = ?`,
                [tenantId]
            );
            tenant = updatedRows[0];
        }

        const now = new Date();
        const endDate = tenant.subscription_end_date ? new Date(tenant.subscription_end_date) : null;

        let daysRemaining = 0;
        if (endDate && endDate > now) {
            const diffTime = Math.abs(endDate - now);
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        res.json({
            status: tenant.subscription_status,
            plan: tenant.plan_name || 'Express', // Fallback name just in case
            daysRemaining,
            expiryDate: endDate
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const subscribeToPlan = async (req, res) => {
    const tenantId = req.tenantId;
    const { plan_id } = req.body; // In real world, payment token/id would go here

    if (!plan_id) return res.status(400).json({ message: "Plan ID required" });

    let connection;
    try {
        connection = await getExpressConnection();

        // 1. Get Plan Details
        const [plans] = await connection.query("SELECT * FROM express_plans WHERE id = ?", [plan_id]);
        if (plans.length === 0) return res.status(404).json({ message: "Plan not found" });
        const plan = plans[0];

        // 2. Calculate new end date
        // If current sub is active, add to it. If expired, start from now.
        const [tenants] = await connection.query("SELECT subscription_end_date FROM express_tenants WHERE tenant_id = ?", [tenantId]);
        const currentEndDate = tenants[0].subscription_end_date ? new Date(tenants[0].subscription_end_date) : new Date();

        let newEndDate = new Date();
        if (currentEndDate > new Date()) {
            newEndDate = new Date(currentEndDate); // Start from current end date
        }

        newEndDate.setDate(newEndDate.getDate() + plan.duration_days);

        // 3. Update Tenant
        await connection.query(
            `UPDATE express_tenants 
             SET plan_id = ?, subscription_end_date = ?, subscription_status = 'active' 
             WHERE tenant_id = ?`,
            [plan_id, newEndDate, tenantId]
        );

        // 4. Log Notification
        await connection.query(
            "INSERT INTO express_notifications (tenant_id, type, message) VALUES (?, ?, ?)",
            [tenantId, 'subscription', `Has suscrito al plan ${plan.name}. Vence el ${newEndDate.toLocaleDateString()}.`]
        );

        res.json({ message: "Subscription successful", newEndDate });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing subscription" });
    } finally {
        if (connection) connection.release();
    }
};

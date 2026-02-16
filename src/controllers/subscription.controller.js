import { getExpressConnection } from "../database/express_db.js";
import { randomUUID } from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN,
});

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

        // Renewal is allowed 5 days before expiry or if expired
        const canRenew = daysRemaining <= 5 || tenant.subscription_status === 'expired';

        res.json({
            status: tenant.subscription_status,
            plan: tenant.plan_name || 'Express',
            plan_id: tenant.plan_id,
            daysRemaining,
            expiryDate: endDate,
            canRenew
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

/**
 * Create a MercadoPago preference for subscription renewal
 */
export const createRenewalPreference = async (req, res) => {
    const tenantId = req.tenantId;
    const { plan_id } = req.body;

    if (!plan_id) return res.status(400).json({ message: "Plan ID required" });

    let connection;
    try {
        connection = await getExpressConnection();

        // Get plan details
        const [plans] = await connection.query("SELECT * FROM express_plans WHERE id = ?", [plan_id]);
        if (plans.length === 0) return res.status(404).json({ message: "Plan not found" });
        const plan = plans[0];

        // Get tenant info
        const [tenants] = await connection.query(
            "SELECT email, business_name FROM express_tenants WHERE tenant_id = ?",
            [tenantId]
        );
        if (tenants.length === 0) return res.status(404).json({ message: "Tenant not found" });
        const tenant = tenants[0];

        const origin = process.env.FRONTEND_URL || "http://localhost:5173";
        const baseWebhook = (process.env.WEBHOOK_PUBLIC_URL || origin).replace(/\/$/, "");

        const preference = new Preference(mpClient);
        const result = await preference.create({
            body: {
                items: [{
                    id: `EXPRESS_PLAN_${plan.id}`,
                    title: `HoryCore Pocket - Plan ${plan.name}`,
                    description: `Renovación de suscripción por ${plan.duration_days} días`,
                    quantity: 1,
                    unit_price: Number(plan.price),
                    currency_id: "PEN"
                }],
                payer: {
                    email: tenant.email
                },
                back_urls: {
                    success: `${origin}/express/subscription?status=success`,
                    failure: `${origin}/express/subscription?status=failure`,
                    pending: `${origin}/express/subscription?status=pending`
                },
                notification_url: `${baseWebhook}/api/webhook`,
                external_reference: tenant.email,
                auto_return: "approved"
            }
        });

        res.json({
            success: true,
            init_point: result.init_point,
            preference_id: result.id
        });

    } catch (error) {
        console.error("Error creating renewal preference:", error);
        res.status(500).json({ message: "Error creating payment preference", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const verifyPayment = async (req, res) => {
    const { payment_id } = req.body;

    if (!payment_id) return res.status(400).json({ message: "Payment ID required" });

    let connection;
    try {
        // 1. Verify Payment with MercadoPago
        const payment = await new Payment(mpClient).get({ id: payment_id });

        if (payment.status !== 'approved') {
            return res.status(400).json({ message: "Payment not approved", status: payment.status });
        }

        const email = payment.external_reference;
        if (!email) return res.status(400).json({ message: "Invalid payment reference (no email)" });

        connection = await getExpressConnection();

        // 2. Find Tenant
        const [tenants] = await connection.query("SELECT * FROM express_tenants WHERE email = ?", [email]);
        if (tenants.length === 0) return res.status(404).json({ message: "Tenant not found for this payment" });
        const tenant = tenants[0];

        // 3. Activate Subscription
        // Calculate duration and plan based on amount
        let planId = 3; // Default Monthly
        const amount = Number(payment.transaction_amount);

        if (amount < 8) {
            planId = 1; // Diario
        } else if (amount < 25) {
            planId = 2; // Semanal
        }

        // Only activate status. Date will be set on first login or via Webhook.
        await connection.query(
            "UPDATE express_tenants SET subscription_status = 'active', plan_id = ? WHERE tenant_id = ?",
            [planId, tenant.tenant_id]
        );

        // 4. Generate Token (Auto-login)
        const token = jwt.sign(
            { tenant_id: tenant.tenant_id, email: tenant.email, business_name: tenant.business_name, role: 'admin', plan_id: planId },
            TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Subscription activated",
            token,
            business_name: tenant.business_name
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Error verifying payment" });
    } finally {
        if (connection) connection.release();
    }
};

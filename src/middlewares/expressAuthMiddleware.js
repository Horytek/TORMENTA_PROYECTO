import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

import { getExpressConnection } from "../database/express_db.js";

export const expressAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Expect "Bearer <token>"
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided, authorization denied." });
        }

        jwt.verify(token, TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token." });
            }

            // Strict check: Must have tenant_id to be an Express Token
            if (!decoded.tenant_id) {
                return res.status(403).json({ message: "Access denied. Token is not for Express Mode." });
            }

            // Context Injection
            req.tenantId = decoded.tenant_id;
            req.expressUser = decoded;

            // --- SUBSCRIPTION CHECK ---
            // Allow subscription routes to pass even if expired
            const path = req.path;
            const isSubscriptionRoute = path.includes('/subscription') || path.includes('/auth/logout');

            let connection;
            try {
                connection = await getExpressConnection();
                const [rows] = await connection.query("SELECT subscription_status, subscription_end_date FROM express_tenants WHERE tenant_id = ?", [decoded.tenant_id]);

                if (rows.length > 0) {
                    const tenant = rows[0];
                    const now = new Date();
                    const endDate = tenant.subscription_end_date ? new Date(tenant.subscription_end_date) : null;

                    let isExpired = false;
                    if (!endDate || endDate < now) {
                        isExpired = true;
                    }

                    // If expired and trying to access PROTECTED route (not subscription/auth), Block
                    if (isExpired && !isSubscriptionRoute) {
                        return res.status(402).json({
                            message: "Subscription Expired",
                            code: "SUBSCRIPTION_EXPIRED",
                            expiryDate: endDate
                        });
                    }
                }
                next();
            } catch (dbError) {
                console.error("DB Error in Auth:", dbError);
                return res.status(500).json({ message: "Internal server error during authorization check." });
            } finally {
                if (connection) connection.release();
            }
        });
    } catch (error) {
        console.error("Express Auth Error:", error);
        return res.status(500).json({ message: "Internal server error during authorization." });
    }
};

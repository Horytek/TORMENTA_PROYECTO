import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const expressAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Expect "Bearer <token>"
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided, authorization denied." });
        }

        jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
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
            next();
        });
    } catch (error) {
        console.error("Express Auth Error:", error);
        return res.status(500).json({ message: "Internal server error during authorization." });
    }
};

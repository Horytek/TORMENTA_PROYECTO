import { getExpressConnection } from "../database/express_db.js";

export const getNotifications = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();
        const [notifications] = await connection.query(
            "SELECT * FROM express_notifications WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50",
            [tenantId]
        );

        // Count unread
        const unreadCount = notifications.filter(n => !n.read_status).length;

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const markAsRead = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    let connection;
    try {
        connection = await getExpressConnection();
        // If id='all', mark all as read
        if (id === 'all') {
            await connection.query("UPDATE express_notifications SET read_status = TRUE WHERE tenant_id = ?", [tenantId]);
        } else {
            await connection.query("UPDATE express_notifications SET read_status = TRUE WHERE id = ? AND tenant_id = ?", [id, tenantId]);
        }
        res.json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

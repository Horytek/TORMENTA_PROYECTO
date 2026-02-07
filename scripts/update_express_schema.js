import { getConnection } from "../src/database/database.js";
import { getExpressConnection } from "../src/database/express_db.js";

async function updateSchema() {
    let connection;
    try {
        console.log("Starting Express Schema Update...");
        connection = await getExpressConnection();

        // 1. Create express_plans table
        console.log("Creating express_plans table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS express_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                duration_days INT NOT NULL,
                description VARCHAR(255)
            )
        `);

        // Seed Plans
        console.log("Seeding plans...");
        await connection.query(`
            INSERT IGNORE INTO express_plans (id, name, price, duration_days, description) VALUES
            (1, 'Diario', 5.00, 1, 'Acceso por 24 horas'),
            (2, 'Semanal', 10.00, 7, 'Acceso por 7 días'),
            (3, 'Mensual', 30.00, 30, 'Acceso por 30 días')
        `);

        // 2. Update express_tenants table
        console.log("Updating express_tenants table...");
        try {
            await connection.query(`ALTER TABLE express_tenants ADD COLUMN plan_id INT DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }

        try {
            await connection.query(`ALTER TABLE express_tenants ADD COLUMN subscription_end_date DATETIME DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }

        try {
            await connection.query(`ALTER TABLE express_tenants ADD COLUMN subscription_status ENUM('active', 'expired', 'trial') DEFAULT 'trial'`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }


        // 3. Update express_users table (Permissions)
        console.log("Updating express_users table...");
        try {
            await connection.query(`ALTER TABLE express_users ADD COLUMN permissions JSON DEFAULT NULL`);
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }


        // 4. Create express_notifications table
        console.log("Creating express_notifications table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS express_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id CHAR(36) NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'stock', 'system', 'subscription'
                message VARCHAR(255) NOT NULL,
                read_status BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (tenant_id)
            )
        `);

        console.log("Schema Update Complete!");

    } catch (error) {
        console.error("Error updating schema:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

updateSchema();

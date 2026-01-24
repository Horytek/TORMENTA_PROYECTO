import { getConnection } from "../src/database/database.js";

const setup = async () => {
    let connection;
    try {
        connection = await getConnection();
        console.log("Connected to DB. Creating table...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS config_verificacion_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_rol INT NOT NULL,
                id_tenant INT NOT NULL,
                UNIQUE KEY unique_rol_tenant (id_rol, id_tenant)
            )
        `);

        console.log("Table 'config_verificacion_roles' created/verified.");
    } catch (error) {
        console.error("Error creating table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

setup();

import { getConnection } from "../src/database/database.js";

const update = async () => {
    let connection;
    try {
        connection = await getConnection();
        console.log("Updating schema...");

        await connection.query("DROP TABLE IF EXISTS config_verificacion_roles");

        await connection.query(`
            CREATE TABLE config_verificacion_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_rol INT NOT NULL,
                id_tenant INT NOT NULL,
                stage VARCHAR(10) NOT NULL COMMENT 'verify | approve',
                UNIQUE KEY unique_rol_stage (id_rol, id_tenant, stage)
            )
        `);

        console.log("Table recreated with 'stage' column.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

update();

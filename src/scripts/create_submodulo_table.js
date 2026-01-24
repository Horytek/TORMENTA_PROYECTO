import { getConnection } from "../database/database.js";

const createSubModuloTable = async () => {
    let connection;
    try {
        connection = await getConnection();

        console.log("Creating table 'sub_modulo'...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sub_modulo (
                id_submodulo INT AUTO_INCREMENT PRIMARY KEY,
                nom_submodulo VARCHAR(100) NOT NULL,
                id_modulo INT NOT NULL,
                view_panel TINYINT DEFAULT 1,
                ruta VARCHAR(100) DEFAULT NULL,
                estado_submodulo TINYINT DEFAULT 1,
                FOREIGN KEY (id_modulo) REFERENCES modulo(id_modulo) ON DELETE CASCADE
            )
        `);
        console.log("Table 'sub_modulo' created successfully.");

    } catch (error) {
        console.error("Error creating table:", error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

createSubModuloTable();

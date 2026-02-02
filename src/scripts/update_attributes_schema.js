
import { getConnection } from "../database/database.js";

const runMigration = async () => {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await getConnection();

        console.log("Checking 'atributo' table schema...");
        const [columns] = await connection.query("SHOW COLUMNS FROM atributo");
        const columnNames = columns.map(c => c.Field);

        const columnsToAdd = [
            { name: "es_filtro", type: "TINYINT(1) DEFAULT 0" },
            { name: "es_visible", type: "TINYINT(1) DEFAULT 1" },
            { name: "es_requerido", type: "TINYINT(1) DEFAULT 0" }
        ];

        for (const col of columnsToAdd) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column ${col.name}...`);
                await connection.query(`ALTER TABLE atributo ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Column ${col.name} added.`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();

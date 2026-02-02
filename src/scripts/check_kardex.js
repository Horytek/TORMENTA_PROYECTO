
import { getConnection } from "../database/database.js";

const checkKardex = async () => {
    let connection;
    try {
        connection = await getConnection();

        console.log("Checking tables like '%kardex%'...");
        const [tables] = await connection.query("SHOW TABLES LIKE '%kardex%'");
        console.log("Tables found:", tables);

        console.log("Checking tables like '%bitacora%'...");
        const [tablesB] = await connection.query("SHOW TABLES LIKE '%bitacora%'");
        console.log("Tables found:", tablesB);

        if (tables.length > 0) {
            const tableName = Object.values(tables[0])[0];
            console.log(`Columns in ${tableName}:`);
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(columns.map(c => c.Field));
        }

        if (tablesB.length > 0) {
            const tableName = Object.values(tablesB[0])[0];
            console.log(`Columns in ${tableName}:`);
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(columns.map(c => c.Field));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

checkKardex();

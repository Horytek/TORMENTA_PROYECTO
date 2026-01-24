import { getConnection } from "../database/database.js";

const checkTables = async () => {
    let connection;
    try {
        connection = await getConnection();

        console.log("--- Check Tables ---");
        const [tables] = await connection.query("SHOW TABLES LIKE 'sub%'");
        console.log(JSON.stringify(tables, null, 2));

        console.log("--- Content of submodulos (Legacy?) ---");
        try {
            const [rows] = await connection.query("SELECT * FROM submodulos LIMIT 5");
            console.log(JSON.stringify(rows, null, 2));
        } catch (e) {
            console.log("Error reading submodulos: " + e.message);
        }

        console.log("--- Content of sub_modulo (New?) ---");
        try {
            const [rows] = await connection.query("SELECT * FROM sub_modulo LIMIT 5");
            console.log(JSON.stringify(rows, null, 2));
        } catch (e) {
            console.log("Error reading sub_modulo: " + e.message);
        }

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

checkTables();

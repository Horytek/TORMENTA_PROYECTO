import { getConnection } from "../database/database.js";

const listTables = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [tables] = await connection.query("SHOW TABLES");
        console.table(tables);
    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

listTables();

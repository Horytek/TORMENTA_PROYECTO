import { getConnection } from "../database/database.js";

const checkSchema = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [modulos] = await connection.query("SHOW TABLES LIKE 'modulo'");
        const [submodulos] = await connection.query("SHOW TABLES LIKE 'sub_modulo'");
        const [allTables] = await connection.query("SHOW TABLES");

        console.log("Modulo table:", modulos);
        console.log("Sub_modulo table:", submodulos);
        // console.log("All tables:", allTables);
    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

checkSchema();

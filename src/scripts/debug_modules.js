import { getConnection } from "../database/database.js";

const debugModules = async () => {
    let connection;
    try {
        connection = await getConnection();

        console.log("--- Modulos ---");
        const [modulos] = await connection.query("SELECT * FROM modulo");
        console.log(JSON.stringify(modulos, null, 2));

        console.log("--- Submodulos ---");
        const [submodulos] = await connection.query("SELECT * FROM sub_modulo");
        console.log(JSON.stringify(submodulos, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

debugModules();

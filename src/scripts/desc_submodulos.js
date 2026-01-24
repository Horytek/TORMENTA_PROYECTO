import { getConnection } from "../database/database.js";

const describeTable = async () => {
    let connection;
    try {
        connection = await getConnection();

        console.log("--- Desc submodulos ---");
        try {
            const [desc] = await connection.query("DESCRIBE submodulos");
            console.log(desc);
        } catch (e) { console.log(e.message); }

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

describeTable();

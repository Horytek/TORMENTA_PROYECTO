import { getConnection } from "../src/database/database.js";

const insertPermissions = async () => {
    try {
        const connection = await getConnection();
        // Insert permission for role 3 to verify
        // id_rol: 3, id_tenant: 1, stage: 'verify'
        await connection.query("INSERT INTO config_verificacion_roles (id_rol, id_tenant, stage) VALUES (?, ?, ?)", [3, 1, 'verify']);
        console.log("Inserted 'verify' permission for Role 3");
        connection.release();
    } catch (error) {
        console.error(error);
    }
};

insertPermissions();

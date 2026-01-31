import { getConnection } from "../src/database/database.js";

async function deletePerm() {
    const connection = await getConnection();
    console.log("Deleting 'approve' permission for Role 3...");

    const [result] = await connection.query(
        "DELETE FROM config_verificacion_roles WHERE id_rol = 3 AND stage = 'approve'"
    );
    console.log("Deleted rows:", result.affectedRows);

    console.log("--- Checking Remaining Permissions for Role 3 ---");
    const [rows] = await connection.query("SELECT * FROM config_verificacion_roles WHERE id_rol = 3");
    console.log(rows);

    connection.release();
    process.exit();
}

deletePerm();

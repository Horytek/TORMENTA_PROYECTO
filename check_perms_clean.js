import { getConnection } from "./src/database/database.js";

async function checkAllPerms() {
    const connection = await getConnection();
    console.log("--- Checking config_verificacion_roles ---");
    const [rows] = await connection.query("SELECT * FROM config_verificacion_roles ORDER BY id_rol");
    console.table(rows);

    console.log("--- Rows for Role 3 ---");
    const role3 = rows.filter(r => r.id_rol == 3);
    console.log(JSON.stringify(role3, null, 2));

    connection.release();
    process.exit();
}

checkAllPerms();

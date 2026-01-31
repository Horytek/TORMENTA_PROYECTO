import { getConnection } from "../src/database/database.js";

async function checkVendedor() {
    const connection = await getConnection();
    console.log("Checking user 'vendedor_5'...");

    try {
        const [users] = await connection.query("SELECT id_usuario, usua, id_rol, id_tenant FROM usuario WHERE usua = 'vendedor_5'");
        if (users.length === 0) {
            console.log("User not found");
            return;
        }
        const user = users[0];
        console.log("User:", user);

        const [perms] = await connection.query(
            "SELECT * FROM config_verificacion_roles WHERE id_rol = ? AND id_tenant = ?",
            [user.id_rol, user.id_tenant]
        );
        console.log(`Permissions for Role ${user.id_rol}:`, perms);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

checkVendedor();

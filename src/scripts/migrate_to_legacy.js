import { getConnection } from "../database/database.js";

const migrateModules = async () => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Get IDs of new modules if they exist, or insert them.
        // We registered 'Gestor Contenidos' and 'Inventario'.
        // Assuming they are in `modulo` table (which is shared).

        const [mod1] = await connection.query("SELECT id_modulo FROM modulo WHERE nombre_modulo = 'Gestor Contenidos'");
        const [mod2] = await connection.query("SELECT id_modulo FROM modulo WHERE nombre_modulo = 'Inventario'");

        if (mod1.length > 0) {
            const idMod1 = mod1[0].id_modulo;
            console.log(`Gestor Contenidos ID: ${idMod1}`);
            // Insert into submodulos
            // submodulos columns: id_submodulo, nombre_sub, id_modulo, view_panel, ruta, estado_submodulo, id_tenant, actions_json?
            // Need to match schema.
            // Based on DESCRIBE, likely: id_submodulo, nombre_sub, id_modulo, ruta...

            // Check duplicados
            const [dup1] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Tonalidades' AND id_modulo = ?", [idMod1]);
            if (dup1.length === 0) {
                await connection.query("INSERT INTO submodulos (nombre_sub, id_modulo, ruta) VALUES (?, ?, ?)", ['Tonalidades', idMod1, '/gestor-contenidos/tonalidades']);
                console.log("Inserted Tonalidades into submodulos");
            }

            const [dup2] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Tallas' AND id_modulo = ?", [idMod1]);
            if (dup2.length === 0) {
                await connection.query("INSERT INTO submodulos (nombre_sub, id_modulo, ruta) VALUES (?, ?, ?)", ['Tallas', idMod1, '/gestor-contenidos/tallas']);
                console.log("Inserted Tallas into submodulos");
            }
        }

        if (mod2.length > 0) {
            const idMod2 = mod2[0].id_modulo;
            console.log(`Inventario ID: ${idMod2}`);

            const [dup3] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Solicitud Inventario' AND id_modulo = ?", [idMod2]);
            if (dup3.length === 0) {
                await connection.query("INSERT INTO submodulos (nombre_sub, id_modulo, ruta) VALUES (?, ?, ?)", ['Solicitud Inventario', idMod2, '/inventario/solicitud']);
                console.log("Inserted Solicitud Inventario into submodulos");
            }

            const [dup4] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Verificación Inventario' AND id_modulo = ?", [idMod2]);
            if (dup4.length === 0) {
                await connection.query("INSERT INTO submodulos (nombre_sub, id_modulo, ruta) VALUES (?, ?, ?)", ['Verificación Inventario', idMod2, '/inventario/verificacion']);
                console.log("Inserted Verificación Inventario into submodulos");
            }
        }

    } catch (error) {
        console.error("Error migrating:", error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

migrateModules();

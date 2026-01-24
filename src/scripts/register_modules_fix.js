import { getConnection } from "../database/database.js";

const registerModules = async () => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Module: Gestor Contenidos (for Tonalidades, Tallas)
        console.log("Registering 'Gestor Contenidos'...");
        const [resMod1] = await connection.query("INSERT INTO modulo (nombre_modulo, ruta) VALUES (?, ?)", ['Gestor Contenidos', '/gestor-contenidos']);
        const idMod1 = resMod1.insertId;

        await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, ruta) VALUES (?, ?, ?)", ['Tonalidades', idMod1, '/gestor-contenidos/tonalidades']);
        await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, ruta) VALUES (?, ?, ?)", ['Tallas', idMod1, '/gestor-contenidos/tallas']);

        // 2. Module: Inventario (for Solicitud, Verificacion) - Check if exists or insert
        // Some systems might have "Almacenes" or similar. Let's create specific "Inventario Avanzado" or just "Inventario"
        console.log("Registering 'Inventario'...");
        const [resMod2] = await connection.query("INSERT INTO modulo (nombre_modulo, ruta) VALUES (?, ?)", ['Inventario', '/inventario']);
        const idMod2 = resMod2.insertId;

        await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, ruta) VALUES (?, ?, ?)", ['Solicitud Inventario', idMod2, '/inventario/solicitud']);
        await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, ruta) VALUES (?, ?, ?)", ['Verificación Inventario', idMod2, '/inventario/verificacion']);

        console.log("Modules registered successfully.");

    } catch (error) {
        console.error("Error registering modules (might already exist):", error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

registerModules();

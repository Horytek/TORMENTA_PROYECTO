
import { getConnection } from './src/database/database.js';

async function fixMigration() {
    const connection = await getConnection();
    try {
        console.log("Starting FIX migration...");

        // 1. Get Module ID 17 (Gestor Contenidos) directly or fetch
        // The previous check showed ID 17 is Gestor Contenidos.
        const idGestor = 17;

        // 2. Insert 'Unidades' Submodule if not exists
        console.log("Registering 'Unidades' submodule...");
        const [existingSub] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Unidades' AND id_modulo = ?", [idGestor]);

        if (existingSub.length > 0) {
            console.log("Unidades already exists at ID:", existingSub[0].id_submodulo);
        } else {
            // NOTE: 'active_actions' column is null in others, 'active' might not exist or is default. 
            // The previous output `active_actions: null` suggests the column exists. 
            // I will insert just basic fields.
            const [res] = await connection.query(`
        INSERT INTO submodulos (id_modulo, nombre_sub, ruta, f_creacion) 
        VALUES (?, 'Unidades', '/gestor-contenidos/unidades', NOW())
      `, [idGestor]);
            console.log("Inserted Unidades at ID:", res.insertId);
        }

        // 3. Insert 'Variantes' Submodule ??
        // If the user wants to see "Variantes" in the permission list, we should add it?
        // The user said: "trate de guardar el submodulo... (/gestor-contenidos/variantes)"
        // If we add this as a submodule, it will appear in the list.
        // Let's add it too so the user can see it and enable it. 
        // This might be redundant with Tallas/Colors but harmless.
        const [existingVar] = await connection.query("SELECT id_submodulo FROM submodulos WHERE nombre_sub = 'Variantes' AND id_modulo = ?", [idGestor]);
        if (existingVar.length > 0) {
            console.log("Variantes already exists at ID:", existingVar[0].id_submodulo);
        } else {
            const [res] = await connection.query(`
        INSERT INTO submodulos (id_modulo, nombre_sub, ruta, f_creacion) 
        VALUES (?, 'Variantes', '/gestor-contenidos/variantes', NOW())
      `, [idGestor]);
            console.log("Inserted Variantes at ID:", res.insertId);
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

fixMigration();

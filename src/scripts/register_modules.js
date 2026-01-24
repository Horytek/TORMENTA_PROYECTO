import { getConnection } from "../database/database.js";

const registerModules = async () => {
    let connection;
    try {
        console.log("Conectando a la DB...");
        connection = await getConnection();

        // 1. Gestor Contenidos (Nuevo Módulo)
        // Verificar si existe
        const [existingGestor] = await connection.query("SELECT id_modulo FROM modulo WHERE nom_modulo = 'Gestor Contenidos'");
        let idGestor;

        if (existingGestor.length === 0) {
            const [result] = await connection.query("INSERT INTO modulo (nom_modulo, estado_modulo, orden) VALUES ('Gestor Contenidos', 1, 90)");
            idGestor = result.insertId;
            console.log("Módulo 'Gestor Contenidos' creado. ID:", idGestor);
        } else {
            idGestor = existingGestor[0].id_modulo;
            console.log("Módulo 'Gestor Contenidos' ya existe. ID:", idGestor);
        }

        // Submodulos para Gestor Contenidos
        const submodulosGestor = [
            { nombre: 'Tonalidades', view_panel: 1 },
            { nombre: 'Tallas', view_panel: 1 }
        ];

        for (const sub of submodulosGestor) {
            const [exists] = await connection.query("SELECT id_submodulo FROM sub_modulo WHERE nom_submodulo = ? AND id_modulo = ?", [sub.nombre, idGestor]);
            if (exists.length === 0) {
                await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, view_panel, estado_submodulo) VALUES (?, ?, ?, 1)", [sub.nombre, idGestor, sub.view_panel]);
                console.log(`Submódulo '${sub.nombre}' creado.`);
            } else {
                console.log(`Submódulo '${sub.nombre}' ya existe.`);
            }
        }

        // 2. Inventario (Módulo Existente)
        const [existingInv] = await connection.query("SELECT id_modulo FROM modulo WHERE nom_modulo = 'Inventario'");
        let idInventario;

        if (existingInv.length > 0) {
            idInventario = existingInv[0].id_modulo;

            // Submodulos para Inventario
            const submodulosInv = [
                { nombre: 'Solicitud Inventario', view_panel: 1 },
                { nombre: 'Verificación Inventario', view_panel: 1 }
            ];

            for (const sub of submodulosInv) {
                const [exists] = await connection.query("SELECT id_submodulo FROM sub_modulo WHERE nom_submodulo = ? AND id_modulo = ?", [sub.nombre, idInventario]);
                if (exists.length === 0) {
                    await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, view_panel, estado_submodulo) VALUES (?, ?, ?, 1)", [sub.nombre, idInventario, sub.view_panel]);
                    console.log(`Submódulo '${sub.nombre}' creado en Inventario.`);
                } else {
                    console.log(`Submódulo '${sub.nombre}' ya existe en Inventario.`);
                }
            }
        } else {
            console.log("ADVERTENCIA: No se encontró el módulo 'Inventario'.");
        }

        // 3. Insertar 'Gestor Módulos' si no existe (para desarrollador, aunque suele estar hardcodeado o en otro modulo)
        // Asumimos que Desarrollador -> Gestor Modulos
        // Verificar modulo Desarrollador
        const [existDev] = await connection.query("SELECT id_modulo FROM modulo WHERE nom_modulo = 'Desarrollador'");
        if (existDev.length > 0) {
            const idDev = existDev[0].id_modulo;
            const [existsGM] = await connection.query("SELECT id_submodulo FROM sub_modulo WHERE nom_submodulo = 'Gestor Módulos' AND id_modulo = ?", [idDev]);
            if (existsGM.length === 0) {
                await connection.query("INSERT INTO sub_modulo (nom_submodulo, id_modulo, view_panel, estado_submodulo) VALUES ('Gestor Módulos', ?, 1, 1)", [idDev]);
                console.log("Submódulo 'Gestor Módulos' creado.");
            }
        }


        console.log("Registro de módulos completado.");

    } catch (error) {
        console.error("Error registrando módulos:", error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

registerModules();

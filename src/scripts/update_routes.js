import { getConnection } from "../database/database.js";

const updateRoutes = async () => {
    let connection;
    try {
        connection = await getConnection();

        // Updates
        const updates = [
            { nombre: 'Tonalidades', ruta: 'tonalidades' },
            { nombre: 'Tallas', ruta: 'tallas' },
            { nombre: 'Solicitud Inventario', ruta: 'solicitud_inventario' },
            { nombre: 'Verificación Inventario', ruta: 'verificacion_inventario' }
        ];

        for (const up of updates) {
            const [res] = await connection.query("UPDATE sub_modulo SET ruta = ? WHERE nom_submodulo = ?", [up.ruta, up.nombre]);
            console.log(`Updated ${up.nombre} -> ${up.ruta}: ${res.affectedRows} rows`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

updateRoutes();

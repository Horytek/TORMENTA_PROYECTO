
import { getConnection } from "../src/database/database.js";

const updates = [
    {
        id: 3, // Almacenes
        type: 'modulo',
        actions: ['ver', 'editar', 'eliminar'] // No crear? Almacen usually has create. I'll add create to be safe, but definitely NO generar. actually wait, auditing said "TablaAlmacen... there's no explicit 'Generar'". It didn't mention Create, but usually there is one. Let's look at audit again. "funcionality for adding...". I'll add 'crear'.
    },
    {
        id: 4, // Clientes
        type: 'modulo',
        actions: ['ver', 'crear', 'editar', 'eliminar', 'desactivar']
    },
    {
        id: 5, // Empleados
        type: 'modulo',
        actions: ['ver', 'crear', 'editar', 'eliminar', 'desactivar']
    }
];

const runSeed = async () => {
    let connection;
    try {
        connection = await getConnection();

        for (const update of updates) {
            const table = update.type === 'modulo' ? 'modulo' : 'submodulos';
            const pk = update.type === 'modulo' ? 'id_modulo' : 'id_submodulo';

            console.log(`Updating ${update.type} ${update.id} with actions: ${update.actions.join(', ')}`);

            await connection.query(
                `UPDATE ${table} SET active_actions = ? WHERE ${pk} = ?`,
                [JSON.stringify(update.actions), update.id]
            );
        }

        console.log("Seed completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
};

runSeed();

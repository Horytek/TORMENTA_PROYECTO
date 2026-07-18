import { getConnection } from '../src/database/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Backfill de metadata visual (icon/group_name/sort_order/frontend_route/is_visible)
 * para las filas de `modulo`/`submodulos` que ya tienen pantalla real en client-v2.
 *
 * Espejo del `MODULE_META` curado en client-v2/src/lib/navigationCatalog.ts —
 * es un script de una sola ejecución (seed), no una fuente viva; si agregas un
 * módulo nuevo después de correr esto, usa el panel Developer (ModulosTab) para
 * setear su metadata en vez de volver a correr este script.
 */
const MODULE_META = [
    { slug: "productos", icon: "Tags", group: "General", route: "/products", sort_order: 1 },
    { slug: "ventas", icon: "ShoppingCart", group: "General", route: "/sales", sort_order: 2 },
    { slug: "almacen", icon: "Package", group: "Logística", route: "/inventory", sort_order: 1 },
    { slug: "almaceng", icon: "Warehouse", group: "Logística", route: "/logistics/warehouses", sort_order: 2 },
    { slug: "nota_almacen", icon: "ClipboardList", group: "Logística", route: "/logistics/warehouse-notes", sort_order: 3 },
    { slug: "guia_remision", icon: "Truck", group: "Logística", route: "/logistics/guides", sort_order: 4 },
    { slug: "sucursal", icon: "Building", group: "Logística", route: "/logistics/branches", sort_order: 5 },
    { slug: "clientes", icon: "User", group: "Personas", route: "/people/clients", sort_order: 1 },
    { slug: "proveedores", icon: "Users", group: "Personas", route: "/people/providers", sort_order: 2 },
    { slug: "empleados", icon: "Users", group: "Personas", route: "/people/employees", sort_order: 3 },
    { slug: "reportes", icon: "FileSpreadsheet", group: "Reportes", route: "/reports/sales", sort_order: 1 },
    { slug: "contabilidad", icon: "Wallet", group: "Reportes", route: "/accounting", sort_order: 2 },
    { slug: "configuracion/usuarios", icon: "Users", group: "Ajustes", route: "/settings/users", sort_order: 1 },
    { slug: "configuracion/roles", icon: "ShieldAlert", group: "Ajustes", route: "/settings/roles", sort_order: 2 },
    { slug: "configuracion/negocio", icon: "Settings", group: "Ajustes", route: "/settings/system", sort_order: 3 },
];

function normalize(ruta) {
    return (ruta || "").toString().toLowerCase().replace(/^\/+/, "");
}

async function backfill() {
    let connection;
    try {
        connection = await getConnection();
        console.log("Conectado a la base de datos.");

        const [modulos] = await connection.query("SELECT id_modulo, ruta FROM modulo");
        const [submodulos] = await connection.query("SELECT id_submodulo, ruta FROM submodulos");

        let actualizados = 0;
        let sinMatch = [];

        for (const meta of MODULE_META) {
            const moduloMatch = modulos.find((m) => normalize(m.ruta) === meta.slug);
            const submoduloMatch = submodulos.find((s) => normalize(s.ruta) === meta.slug);

            if (moduloMatch) {
                await connection.query(
                    "UPDATE modulo SET icon = ?, group_name = ?, sort_order = ?, frontend_route = ?, is_visible = 1 WHERE id_modulo = ?",
                    [meta.icon, meta.group, meta.sort_order, meta.route, moduloMatch.id_modulo]
                );
                actualizados++;
            } else if (submoduloMatch) {
                await connection.query(
                    "UPDATE submodulos SET icon = ?, group_name = ?, sort_order = ?, frontend_route = ?, is_visible = 1 WHERE id_submodulo = ?",
                    [meta.icon, meta.group, meta.sort_order, meta.route, submoduloMatch.id_submodulo]
                );
                actualizados++;
            } else {
                sinMatch.push(meta.slug);
            }
        }

        console.log(`Filas actualizadas: ${actualizados}/${MODULE_META.length}`);
        if (sinMatch.length > 0) {
            console.log("Slugs sin match en BD (revisar ruta en modulo/submodulos):", sinMatch);
        }
    } catch (error) {
        console.error("Error durante el backfill:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

backfill();

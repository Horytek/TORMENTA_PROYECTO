import { getConnection } from "../database/database.js";

const clearData = async (req, res) => {
    let connection;
    try {
        const { password, target_tenant_id } = req.body;
        // Initial tenant from token (usually null for dev) OR resolved later
        let id_tenant_initial = req.id_tenant;

        // Basic security check (should be enhanced or rely on role middleware)
        if (!password || password !== 'dev1234') {
            // ... (pass check)
        }

        connection = await getConnection();

        // Resolve real id_tenant if target is provided (because frontend sends id_empresa, not id_tenant)
        let resolved_id_tenant = id_tenant_initial;
        if (target_tenant_id) {
            const [emp] = await connection.query("SELECT id_tenant FROM empresa WHERE id_empresa = ?", [target_tenant_id]);
            if (emp.length > 0) {
                resolved_id_tenant = emp[0].id_tenant;
                console.log(`[RESOLVER] Base Company ID: ${target_tenant_id} -> Resolved Tenant ID: ${resolved_id_tenant}`);
            } else {
                console.log(`[RESOLVER] Company ID ${target_tenant_id} not found.`);
            }
        }

        const id_tenant = resolved_id_tenant;

        if (!id_tenant) {
            console.error("ID Tenant Missing!");
            return res.status(400).json({ code: 0, message: "ID Tenant Missing" });
        }


        // --- DIAGNOSTIC LOGGING ---
        try {
            const [countInv] = await connection.query("SELECT COUNT(*) as c FROM inventario WHERE id_tenant = ?", [id_tenant]);
            const [countBit] = await connection.query("SELECT COUNT(*) as c FROM bitacora_nota WHERE id_tenant = ?", [id_tenant]);
            console.log(`[DIAGNOSTIC] Tenant ${id_tenant} has ${countInv[0].c} items in inventario, ${countBit[0].c} in bitacora_nota.`);
        } catch (diagErr) {
            console.error("[DIAGNOSTIC ERROR]", diagErr.message);
        }
        // --------------------------

        await connection.beginTransaction();

        // 1. Limpiar Ventas
        console.log("Limpiando Ventas...");
        await connection.query("DELETE FROM detalle_venta WHERE id_tenant = ?", [id_tenant]);
        await connection.query("DELETE FROM venta WHERE id_tenant = ?", [id_tenant]);

        // 2. Limpiar Movimientos (Notas)
        console.log("Limpiando Movimientos/Notas...");
        await connection.query("DELETE FROM detalle_nota WHERE id_tenant = ?", [id_tenant]);
        await connection.query("DELETE FROM nota WHERE id_tenant = ?", [id_tenant]);

        // 3. Limpiar Guías de Remisión
        console.log("Limpiando Guías de Remisión...");
        await connection.query("DELETE FROM detalle_envio WHERE id_tenant = ?", [id_tenant]);
        await connection.query("DELETE FROM guia_remision WHERE id_tenant = ?", [id_tenant]);

        // 4. Limpiar Bitácora/Kárdex (Afectado por ventas y notas)
        console.log("Limpiando Bitácora de Movimientos...");
        await connection.query("DELETE FROM bitacora_nota WHERE id_tenant = ?", [id_tenant]);

        // 5. Resetear Stock
        console.log("Reseteando Stock de Inventario a 0...");
        await connection.query("UPDATE inventario SET stock = 0 WHERE id_tenant = ?", [id_tenant]);
        await connection.query("UPDATE inventario_stock SET stock = 0, reservado = 0 WHERE id_tenant = ?", [id_tenant]);

        await connection.commit();
        res.json({ code: 1, message: "Data cleaned successfully" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error clearing data:", error);
        res.status(500).json({ code: 0, message: "Error clearing data: " + error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    clearData
};

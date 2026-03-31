import { getConnection } from "../database/database.js";

const clearData = async (req, res) => {
    let connection;
    let currentStep = "init";
    const skipped = [];
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const password = body.password ?? req.query?.password;
        const target_tenant_id = body.target_tenant_id ?? req.query?.target_tenant_id;
        // Initial tenant from token (usually null for dev) OR resolved later
        let id_tenant_initial = req.id_tenant;

        // Basic security check (should be enhanced or rely on role middleware)
        if (!password || password !== 'dev1234') {
            return res.status(403).json({ code: 0, message: "Acceso denegado" });
        }

        connection = await getConnection();

        const tableExists = async (tableName) => {
            const [rows] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
            return rows.length > 0;
        };

        const columnExists = async (tableName, columnName) => {
            const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
            return rows.length > 0;
        };

        const runScopedQuery = async (stepName, tableName, sql, params = [], requiredColumn = "id_tenant") => {
            currentStep = stepName;

            const hasTable = await tableExists(tableName);
            if (!hasTable) {
                skipped.push(`${stepName}: tabla '${tableName}' no existe`);
                return;
            }

            if (requiredColumn) {
                const hasColumn = await columnExists(tableName, requiredColumn);
                if (!hasColumn) {
                    skipped.push(`${stepName}: columna '${requiredColumn}' no existe en '${tableName}'`);
                    return;
                }
            }

            await connection.query(sql, params);
        };

        // Resolve real id_tenant if target is provided (because frontend sends id_empresa, not id_tenant)
        let resolved_id_tenant = id_tenant_initial;
        if (target_tenant_id) {
            currentStep = "resolve_tenant";
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

        const runTenantDelete = async (stepName, tableName, relation = null) => {
            currentStep = stepName;

            const hasTable = await tableExists(tableName);
            if (!hasTable) {
                skipped.push(`${stepName}: tabla '${tableName}' no existe`);
                return;
            }

            const hasOwnTenantColumn = await columnExists(tableName, "id_tenant");
            if (hasOwnTenantColumn) {
                await connection.query(`DELETE FROM \`${tableName}\` WHERE id_tenant = ?`, [id_tenant]);
                return;
            }

            if (!relation) {
                skipped.push(`${stepName}: columna 'id_tenant' no existe en '${tableName}'`);
                return;
            }

            const { parentTable, parentPk, childFk } = relation;

            const hasParentTable = await tableExists(parentTable);
            if (!hasParentTable) {
                skipped.push(`${stepName}: tabla padre '${parentTable}' no existe`);
                return;
            }

            const [hasChildFk, hasParentPk, hasParentTenant] = await Promise.all([
                columnExists(tableName, childFk),
                columnExists(parentTable, parentPk),
                columnExists(parentTable, "id_tenant")
            ]);

            if (!hasChildFk) {
                skipped.push(`${stepName}: columna '${childFk}' no existe en '${tableName}'`);
                return;
            }
            if (!hasParentPk) {
                skipped.push(`${stepName}: columna '${parentPk}' no existe en '${parentTable}'`);
                return;
            }
            if (!hasParentTenant) {
                skipped.push(`${stepName}: columna 'id_tenant' no existe en '${parentTable}'`);
                return;
            }

            await connection.query(
                `DELETE child
                 FROM \`${tableName}\` child
                 INNER JOIN \`${parentTable}\` parent ON parent.\`${parentPk}\` = child.\`${childFk}\`
                 WHERE parent.id_tenant = ?`,
                [id_tenant]
            );
        };


        // --- DIAGNOSTIC LOGGING ---
        try {
            let countInv = "N/A";
            let countBit = "N/A";

            if (await tableExists("inventario") && await columnExists("inventario", "id_tenant")) {
                currentStep = "diagnostic_inventario";
                const [invRows] = await connection.query("SELECT COUNT(*) as c FROM inventario WHERE id_tenant = ?", [id_tenant]);
                countInv = invRows[0]?.c ?? 0;
            }

            if (await tableExists("bitacora_nota") && await columnExists("bitacora_nota", "id_tenant")) {
                currentStep = "diagnostic_bitacora";
                const [bitRows] = await connection.query("SELECT COUNT(*) as c FROM bitacora_nota WHERE id_tenant = ?", [id_tenant]);
                countBit = bitRows[0]?.c ?? 0;
            }

            console.log(`[DIAGNOSTIC] Tenant ${id_tenant} has ${countInv} items in inventario, ${countBit} in bitacora_nota.`);
        } catch (diagErr) {
            console.error("[DIAGNOSTIC ERROR]", diagErr.message);
        }
        // --------------------------

        currentStep = "transaction_begin";
        await connection.beginTransaction();

        // 1. Limpiar Bitácora/Kárdex primero (puede referenciar ventas y notas)
        console.log("Limpiando Bitácora de Movimientos...");
        await runTenantDelete("delete_bitacora_nota_by_nota", "bitacora_nota", { parentTable: "nota", parentPk: "id_nota", childFk: "id_nota" });
        await runTenantDelete("delete_bitacora_nota_by_venta", "bitacora_nota", { parentTable: "venta", parentPk: "id_venta", childFk: "id_venta" });

        // 2. Limpiar Ventas
        console.log("Limpiando Ventas...");
        await runTenantDelete("delete_detalle_venta", "detalle_venta", { parentTable: "venta", parentPk: "id_venta", childFk: "id_venta" });
        await runTenantDelete("delete_venta", "venta");

        // 3. Limpiar Movimientos (Notas)
        console.log("Limpiando Movimientos/Notas...");
        await runTenantDelete("delete_detalle_nota", "detalle_nota", { parentTable: "nota", parentPk: "id_nota", childFk: "id_nota" });
        await runTenantDelete("delete_nota", "nota");

        // 4. Limpiar Guías de Remisión
        console.log("Limpiando Guías de Remisión...");
        await runTenantDelete("delete_detalle_envio", "detalle_envio", { parentTable: "guia_remision", parentPk: "id_guiaremision", childFk: "id_guiaremision" });
        await runTenantDelete("delete_guia_remision", "guia_remision");

        // 5. Resetear Stock
        console.log("Reseteando Stock de Inventario a 0...");
        await runScopedQuery("update_inventario", "inventario", "UPDATE inventario SET stock = 0 WHERE id_tenant = ?", [id_tenant]);
        const hasInventarioStock = await tableExists("inventario_stock");
        if (!hasInventarioStock) {
            skipped.push("update_inventario_stock: tabla 'inventario_stock' no existe");
        } else {
            const hasIdTenant = await columnExists("inventario_stock", "id_tenant");
            if (!hasIdTenant) {
                skipped.push("update_inventario_stock: columna 'id_tenant' no existe en 'inventario_stock'");
            } else {
                const hasReservado = await columnExists("inventario_stock", "reservado");
                currentStep = "update_inventario_stock";
                if (hasReservado) {
                    await connection.query(
                        "UPDATE inventario_stock SET stock = 0, reservado = 0 WHERE id_tenant = ?",
                        [id_tenant]
                    );
                } else {
                    skipped.push("update_inventario_stock: columna 'reservado' no existe, se resetea solo stock");
                    await connection.query("UPDATE inventario_stock SET stock = 0 WHERE id_tenant = ?", [id_tenant]);
                }
            }
        }

        currentStep = "transaction_commit";
        await connection.commit();
        res.json({
            code: 1,
            message: "Data cleaned successfully",
            skipped
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }
        console.error(`Error clearing data at step '${currentStep}':`, error);
        res.status(500).json({
            code: 0,
            message: "Error clearing data: " + error.message,
            step: currentStep,
            skipped
        });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    clearData
};

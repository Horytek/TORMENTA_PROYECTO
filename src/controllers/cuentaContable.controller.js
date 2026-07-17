import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

const getCuentas = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT id_cuenta, codigo, nombre, id_cuenta_padre, tipo, naturaleza, nivel, moneda, estado,
                    es_conciliable, es_presupuestable, es_auxiliar, permite_movimiento
             FROM cuenta_contable
             WHERE id_tenant = ?
             ORDER BY codigo`,
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getCuentas:", error);
        res.status(500).json({ success: false, message: "Error al obtener el plan de cuentas" });
    } finally {
        if (connection) connection.release();
    }
};

const createCuenta = async (req, res) => {
    const { codigo, nombre, id_cuenta_padre, tipo, naturaleza, moneda, es_conciliable, es_presupuestable, es_auxiliar, permite_movimiento } = req.body;
    let connection;
    try {
        connection = await getConnection();

        let nivel = 1;
        if (id_cuenta_padre) {
            const [padre] = await connection.query(
                "SELECT nivel FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ?",
                [id_cuenta_padre, req.id_tenant]
            );
            if (padre.length === 0) {
                return res.status(400).json({ success: false, message: "La cuenta padre no existe" });
            }
            nivel = padre[0].nivel + 1;
        }

        const [result] = await connection.query(
            `INSERT INTO cuenta_contable
                (id_tenant, codigo, nombre, id_cuenta_padre, tipo, naturaleza, nivel, moneda, es_conciliable, es_presupuestable, es_auxiliar, permite_movimiento)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.id_tenant, codigo, nombre, id_cuenta_padre || null, tipo, naturaleza, nivel,
                moneda || "PEN", es_conciliable ? 1 : 0, es_presupuestable ? 1 : 0, es_auxiliar ? 1 : 0,
                permite_movimiento === false ? 0 : 1,
            ]
        );
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "CUENTA_CONTABLE", entity_id: String(result.insertId), action: "CREATE",
            details: { codigo, nombre, tipo, naturaleza },
        });
        res.json({ success: true, id_cuenta: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, message: "Ya existe una cuenta con ese código" });
        }
        console.error("Error en createCuenta:", error);
        res.status(500).json({ success: false, message: "Error al crear la cuenta" });
    } finally {
        if (connection) connection.release();
    }
};

const updateCuenta = async (req, res) => {
    const { id } = req.params;
    const { nombre, es_conciliable, es_presupuestable, es_auxiliar, permite_movimiento, estado } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [existing] = await connection.query(
            "SELECT id_cuenta FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Cuenta no encontrada" });
        }

        const [movimientos] = await connection.query(
            "SELECT COUNT(*) as n FROM asiento_detalle WHERE id_cuenta = ?",
            [id]
        );
        // Con movimientos: solo se permite ajustar nombre/flags, no el tipo/naturaleza/código (identidad contable).
        const tieneMovimientos = movimientos[0].n > 0;
        if (tieneMovimientos && (req.body.tipo || req.body.naturaleza || req.body.codigo)) {
            return res.status(400).json({
                success: false,
                message: "La cuenta tiene movimientos asociados: no se puede cambiar su tipo, naturaleza o código",
            });
        }

        await connection.query(
            `UPDATE cuenta_contable SET
                nombre = COALESCE(?, nombre),
                es_conciliable = COALESCE(?, es_conciliable),
                es_presupuestable = COALESCE(?, es_presupuestable),
                es_auxiliar = COALESCE(?, es_auxiliar),
                permite_movimiento = COALESCE(?, permite_movimiento),
                estado = COALESCE(?, estado)
             WHERE id_cuenta = ? AND id_tenant = ?`,
            [
                nombre ?? null,
                es_conciliable === undefined ? null : (es_conciliable ? 1 : 0),
                es_presupuestable === undefined ? null : (es_presupuestable ? 1 : 0),
                es_auxiliar === undefined ? null : (es_auxiliar ? 1 : 0),
                permite_movimiento === undefined ? null : (permite_movimiento ? 1 : 0),
                estado === undefined ? null : (estado ? 1 : 0),
                id, req.id_tenant,
            ]
        );
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "CUENTA_CONTABLE", entity_id: String(id), action: "UPDATE", details: req.body,
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Error en updateCuenta:", error);
        res.status(500).json({ success: false, message: "Error al actualizar la cuenta" });
    } finally {
        if (connection) connection.release();
    }
};

const deleteCuenta = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        const [existing] = await connection.query(
            "SELECT id_cuenta FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Cuenta no encontrada" });
        }

        const [hijos] = await connection.query(
            "SELECT COUNT(*) as n FROM cuenta_contable WHERE id_cuenta_padre = ?",
            [id]
        );
        if (hijos[0].n > 0) {
            return res.status(400).json({ success: false, message: "La cuenta tiene subcuentas asociadas: elimínalas primero" });
        }

        const [movimientos] = await connection.query(
            "SELECT COUNT(*) as n FROM asiento_detalle WHERE id_cuenta = ?",
            [id]
        );
        if (movimientos[0].n > 0) {
            return res.status(400).json({ success: false, message: "La cuenta tiene movimientos contables asociados: no se puede eliminar" });
        }

        await connection.query("DELETE FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ?", [id, req.id_tenant]);
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "CUENTA_CONTABLE", entity_id: String(id), action: "DELETE",
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Error en deleteCuenta:", error);
        res.status(500).json({ success: false, message: "Error al eliminar la cuenta" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getCuentas, createCuenta, updateCuenta, deleteCuenta };

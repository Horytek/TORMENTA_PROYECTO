import { getConnection } from "../database/database.js";

// ─────────────────────────────────────────────────────────────────
// Categorías de gasto
// ─────────────────────────────────────────────────────────────────
const getCategorias = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            "SELECT id_categoria, nombre, estado FROM gasto_categoria WHERE id_tenant = ? AND estado = 1 ORDER BY nombre",
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getCategorias (gastos):", error);
        res.status(500).json({ success: false, message: "Error al obtener categorías de gasto" });
    } finally {
        if (connection) connection.release();
    }
};

const createCategoria = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ success: false, message: "El nombre de la categoría es obligatorio" });
    }
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            "INSERT INTO gasto_categoria (id_tenant, nombre) VALUES (?, ?)",
            [req.id_tenant, nombre.trim()]
        );
        res.json({ success: true, id_categoria: result.insertId });
    } catch (error) {
        console.error("Error en createCategoria (gastos):", error);
        res.status(500).json({ success: false, message: "Error al crear categoría de gasto" });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────
// Gastos
// ─────────────────────────────────────────────────────────────────
const getGastos = async (req, res) => {
    const { fechaInicio, fechaFin, idCategoria } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["g.id_tenant = ?", "g.estado = 1"];
        const params = [req.id_tenant];
        if (fechaInicio) { where.push("g.fecha >= ?"); params.push(fechaInicio); }
        if (fechaFin) { where.push("g.fecha <= ?"); params.push(fechaFin); }
        if (idCategoria) { where.push("g.id_categoria = ?"); params.push(idCategoria); }

        const [rows] = await connection.query(
            `SELECT g.id_gasto, g.descripcion, g.monto, g.fecha, g.id_categoria,
                    c.nombre AS categoria, u.usua AS usuario
             FROM gasto g
             INNER JOIN gasto_categoria c ON c.id_categoria = g.id_categoria
             LEFT JOIN usuario u ON u.id_usuario = g.id_usuario
             WHERE ${where.join(" AND ")}
             ORDER BY g.fecha DESC, g.id_gasto DESC`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getGastos:", error);
        res.status(500).json({ success: false, message: "Error al obtener gastos" });
    } finally {
        if (connection) connection.release();
    }
};

const createGasto = async (req, res) => {
    const { descripcion, monto, fecha, id_categoria } = req.body;
    const id_usuario = req.user?.id_usuario;
    if (!descripcion?.trim() || !monto || Number(monto) <= 0 || !fecha || !id_categoria) {
        return res.status(400).json({ success: false, message: "Faltan campos obligatorios o el monto no es válido" });
    }
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `INSERT INTO gasto (id_tenant, id_categoria, descripcion, monto, fecha, id_usuario)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.id_tenant, id_categoria, descripcion.trim(), Number(monto), fecha, id_usuario]
        );
        res.json({ success: true, id_gasto: result.insertId });
    } catch (error) {
        console.error("Error en createGasto:", error);
        res.status(500).json({ success: false, message: "Error al registrar el gasto" });
    } finally {
        if (connection) connection.release();
    }
};

const deleteGasto = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            "UPDATE gasto SET estado = 0 WHERE id_gasto = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        res.json({ success: true, message: "Gasto eliminado" });
    } catch (error) {
        console.error("Error en deleteGasto:", error);
        res.status(500).json({ success: false, message: "Error al eliminar el gasto" });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────
// Estado de Resultados (P&L) simple: ingresos (ventas activas) - gastos,
// en un rango de fechas. No es contabilidad de partida doble — es la
// versión "simple" acordada (Fase 4 del roadmap client-v2).
// ─────────────────────────────────────────────────────────────────
const getPL = async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: "fechaInicio y fechaFin son obligatorios" });
    }
    let connection;
    try {
        connection = await getConnection();

        const [[ingresosRow]] = await connection.query(
            `SELECT COALESCE(SUM(dv.total), 0) AS ingresos
             FROM venta v
             INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
             WHERE v.id_tenant = ? AND v.estado_venta = 1
               AND v.f_venta BETWEEN ? AND ?`, // sin DATE(): f_venta ya es DATE y la función impedía usar el índice
            [req.id_tenant, fechaInicio, fechaFin]
        );

        const [gastosPorCategoria] = await connection.query(
            `SELECT c.nombre AS categoria, COALESCE(SUM(g.monto), 0) AS total
             FROM gasto g
             INNER JOIN gasto_categoria c ON c.id_categoria = g.id_categoria
             WHERE g.id_tenant = ? AND g.estado = 1
               AND g.fecha BETWEEN ? AND ?
             GROUP BY c.id_categoria, c.nombre
             ORDER BY total DESC`,
            [req.id_tenant, fechaInicio, fechaFin]
        );

        const ingresos = Number(ingresosRow.ingresos) || 0;
        const gastos = gastosPorCategoria.reduce((acc, g) => acc + Number(g.total), 0);

        res.json({
            success: true,
            data: {
                ingresos,
                gastos,
                utilidad: ingresos - gastos,
                gastosPorCategoria,
            },
        });
    } catch (error) {
        console.error("Error en getPL:", error);
        res.status(500).json({ success: false, message: "Error al calcular el estado de resultados" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getCategorias,
    createCategoria,
    getGastos,
    createGasto,
    deleteGasto,
    getPL,
};

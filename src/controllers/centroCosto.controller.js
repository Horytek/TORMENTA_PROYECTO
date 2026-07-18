import { getConnection } from "../database/database.js";

const getCentrosCosto = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT cc.id_centro_costo, cc.codigo, cc.nombre, cc.id_sucursal, cc.estado, s.nombre_sucursal
             FROM centro_costo cc
             LEFT JOIN sucursal s ON cc.id_sucursal = s.id_sucursal
             WHERE cc.id_tenant = ?
             ORDER BY cc.codigo`,
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getCentrosCosto:", error);
        res.status(500).json({ success: false, message: "Error al obtener centros de costo" });
    } finally {
        if (connection) connection.release();
    }
};

const createCentroCosto = async (req, res) => {
    const { codigo, nombre, id_sucursal } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            "INSERT INTO centro_costo (id_tenant, codigo, nombre, id_sucursal) VALUES (?, ?, ?, ?)",
            [req.id_tenant, codigo, nombre, id_sucursal || null]
        );
        res.json({ success: true, id_centro_costo: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, message: "Ya existe un centro de costo con ese código" });
        }
        console.error("Error en createCentroCosto:", error);
        res.status(500).json({ success: false, message: "Error al crear el centro de costo" });
    } finally {
        if (connection) connection.release();
    }
};

const updateCentroCosto = async (req, res) => {
    const { id } = req.params;
    const { nombre, id_sucursal, estado } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `UPDATE centro_costo SET
                nombre = COALESCE(?, nombre),
                id_sucursal = ?,
                estado = COALESCE(?, estado)
             WHERE id_centro_costo = ? AND id_tenant = ?`,
            [nombre ?? null, id_sucursal ?? null, estado === undefined ? null : (estado ? 1 : 0), id, req.id_tenant]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Centro de costo no encontrado" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error en updateCentroCosto:", error);
        res.status(500).json({ success: false, message: "Error al actualizar el centro de costo" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getCentrosCosto, createCentroCosto, updateCentroCosto };

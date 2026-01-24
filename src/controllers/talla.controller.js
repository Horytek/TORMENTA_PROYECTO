import { getConnection } from "../database/database.js";

const getTallas = async (req, res) => {
    try {
        const connection = await getConnection();
        const { id_tenant } = req;
        const [result] = await connection.query("SELECT * FROM talla WHERE id_tenant = ? ORDER BY nombre ASC", [id_tenant]);
        res.json({ code: 1, data: result });
        connection.release(); // Important: release connection
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al obtener tallas" });
    }
};

const addTalla = async (req, res) => {
    try {
        const { nombre, orden } = req.body;
        const { id_tenant } = req;

        if (!nombre) return res.status(400).json({ message: "Nombre es requerido" });

        const connection = await getConnection();
        const [result] = await connection.query(
            "INSERT INTO talla (nombre, orden, id_tenant) VALUES (?, ?, ?)",
            [nombre, orden || 0, id_tenant]
        );

        res.json({ code: 1, message: "Talla agregada", data: { id: result.insertId, nombre, orden } });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al agregar talla" });
    }
};

const updateTalla = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, orden } = req.body;
        const { id_tenant } = req;

        const connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE talla SET nombre = ?, orden = ? WHERE id_talla = ? AND id_tenant = ?",
            [nombre, orden || 0, id, id_tenant]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "Talla no encontrada" });

        res.json({ code: 1, message: "Talla actualizada" });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al actualizar talla" });
    }
};

const deleteTalla = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_tenant } = req;

        const connection = await getConnection();
        // Check usage before delete might be good, but for now simple delete
        const [result] = await connection.query("DELETE FROM talla WHERE id_talla = ? AND id_tenant = ?", [id, id_tenant]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Talla no encontrada" });

        res.json({ code: 1, message: "Talla eliminada" });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al eliminar talla" });
    }
};

export const methods = {
    getTallas,
    addTalla,
    updateTalla,
    deleteTalla
};

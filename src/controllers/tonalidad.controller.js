import { getConnection } from "../database/database.js";

const getTonalidades = async (req, res) => {
    try {
        const connection = await getConnection();
        const { id_tenant } = req;
        const [result] = await connection.query("SELECT * FROM tonalidad WHERE id_tenant = ? ORDER BY nombre ASC", [id_tenant]);
        res.json({ code: 1, data: result });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al obtener tonalidades" });
    }
};

const addTonalidad = async (req, res) => {
    try {
        const { nombre, codigo_hex } = req.body;
        const { id_tenant } = req;

        if (!nombre) return res.status(400).json({ message: "Nombre es requerido" });

        const connection = await getConnection();
        // `hex_code` es la única columna de color: es la que lee el resto del
        // sistema (productos.controller.js). La duplicada `codigo_hex` se
        // retiró — el cuerpo de la petición conserva ese nombre para no romper
        // al frontend que ya lo envía.
        const [result] = await connection.query(
            "INSERT INTO tonalidad (nombre, hex_code, id_tenant) VALUES (?, ?, ?)",
            [nombre, codigo_hex, id_tenant]
        );

        res.json({ code: 1, message: "Tonalidad agregada", data: { id: result.insertId, nombre, codigo_hex } });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al agregar tonalidad" });
    }
};

const updateTonalidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigo_hex } = req.body;
        const { id_tenant } = req;

        const connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE tonalidad SET nombre = ?, hex_code = ? WHERE id_tonalidad = ? AND id_tenant = ?",
            [nombre, codigo_hex, id, id_tenant]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "Tonalidad no encontrada" });

        res.json({ code: 1, message: "Tonalidad actualizada" });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al actualizar tonalidad" });
    }
};

const deleteTonalidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_tenant } = req;

        const connection = await getConnection();
        const [result] = await connection.query("DELETE FROM tonalidad WHERE id_tonalidad = ? AND id_tenant = ?", [id, id_tenant]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Tonalidad no encontrada" });

        res.json({ code: 1, message: "Tonalidad eliminada" });
        connection.release();
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al eliminar tonalidad" });
    }
};

export const methods = {
    getTonalidades,
    addTonalidad,
    updateTonalidad,
    deleteTonalidad
};

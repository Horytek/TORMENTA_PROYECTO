import { getConnection } from "./../database/database";

const getCategorias = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_categoria, nom_categoria, estado_categoria
            FROM categoria
        `);
        res.json({ code: 1, data: result, message: "Categorías listadas" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const getCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_categoria, nom_categoria, estado_categoria
            FROM categoria
            WHERE id_categoria = ?`, [id]);
        
        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Categoría no encontrada" });
        }

        res.json({ data: result, message: "Categoría encontrada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const addCategoria = async (req, res) => {
    try {
        const { nom_categoria, estado_categoria } = req.body;

        if (typeof nom_categoria !== 'string' || nom_categoria.trim() === '' || typeof estado_categoria !== 'number') {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const categoria = { nom_categoria: nom_categoria.trim(), estado_categoria };
        const connection = await getConnection();
        await connection.query("INSERT INTO categoria SET ? ", categoria);
        const [idAdd] = await connection.query("SELECT id_categoria FROM categoria WHERE nom_categoria = ?", nom_categoria);

        res.status(201).json({code: 1, message: "Categoría añadida con éxito", id: idAdd[0].id_categoria });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_categoria, estado_categoria } = req.body;

        const connection = await getConnection();
        const [result] = await connection.query(`
            UPDATE categoria 
            SET nom_categoria = ?, estado_categoria = ?
            WHERE id_categoria = ?`, [nom_categoria, estado_categoria, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Categoría no encontrada" });
        }

        res.json({ message: "Categoría actualizada con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const deactivateCategoria = async (req, res) => {
    const { id } = req.params;
    const connection = await getConnection();
    try {
        const [result] = await connection.query("UPDATE categoria SET estado_categoria = 0 WHERE id_categoria = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Categoría no encontrada" });
        }

        res.json({ message: "Categoría dada de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("DELETE FROM categoria WHERE id_categoria = ?", [id]);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Categoría no encontrada" });
        }

        res.json({ code: 1, message: "Categoría eliminada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

export const methods = {
    getCategorias,
    getCategoria,
    addCategoria,
    updateCategoria,
    deactivateCategoria,
    deleteCategoria
};

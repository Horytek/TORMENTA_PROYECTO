import { getConnection } from "./../database/database";

const getSubCategorias = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
        `);
        res.json({ code: 1, data: result, message: "Subcategorías listadas" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const getSubcategoriesForCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
            WHERE id_categoria = ?
        `, [id]);

        if (result.length === 0) {
            return res.status(404).json({code: 0, data: result, message: "Subcategorías de categoría no encontradas" });
        }

        res.json({ code: 1, data: result, message: "Subcategorías de categoría listadas" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const getSubCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
            WHERE id_subcategoria = ?`, [id]);
        
        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Subcategoría no encontrada" });
        }

        res.json({ data: result, message: "Subcategoría encontrada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const addSubCategoria = async (req, res) => {
    try {
        const { id_categoria, nom_subcat, estado_subcat } = req.body;

        if (typeof id_categoria !== 'number' || typeof nom_subcat !== 'string' || nom_subcat.trim() === '' || typeof estado_subcat !== 'number') {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const subcategoria = { id_categoria, nom_subcat: nom_subcat.trim(), estado_subcat };
        const connection = await getConnection();
        await connection.query("INSERT INTO sub_categoria SET ? ", subcategoria);

        res.status(201).json({code:1, message: "Subcategoría añadida con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const updateSubCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_categoria, nom_subcat, estado_subcat } = req.body;

        const connection = await getConnection();
        const [result] = await connection.query(`
            UPDATE sub_categoria 
            SET id_categoria = ?, nom_subcat = ?, estado_subcat = ?
            WHERE id_subcategoria = ?`, [id_categoria, nom_subcat, estado_subcat, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subcategoría no encontrada" });
        }

        res.json({ message: "Subcategoría actualizada con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const deactivateSubCategoria = async (req, res) => {
    const { id } = req.params;
    const connection = await getConnection();
    try {
        const [result] = await connection.query("UPDATE sub_categoria SET estado_subcat = 0 WHERE id_subcategoria = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Subcategoría no encontrada" });
        }

        res.json({ message: "Subcategoría dada de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const deleteSubCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("DELETE FROM sub_categoria WHERE id_subcategoria = ?", [id]);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Subcategoría no encontrada" });
        }

        res.json({ code: 1, message: "Subcategoría eliminada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

export const methods = {
    getSubCategorias,
    getSubcategoriesForCategory,
    getSubCategoria,
    addSubCategoria,
    updateSubCategoria,
    deactivateSubCategoria,
    deleteSubCategoria
};

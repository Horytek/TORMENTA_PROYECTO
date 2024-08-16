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
        const [idAdd] = await connection.query("SELECT id_subcategoria FROM sub_categoria WHERE nom_subcat = ?", nom_subcat);

        res.status(201).json({code:1, message: "Subcategoría añadida con éxito", id: idAdd[0].id_subcategoria });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const updateSubCategoria = async (req, res) => {
    try {
        const { id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria } = req.body;

        // Verifica si id_categoria está definido
        if (id_categoria === undefined) {
            return res.status(400).json({ message: "ID de categoría es requerido" });
        }

        const connection = await getConnection();
        
        const [resultSubCat] = await connection.query(`
            UPDATE sub_categoria 
            SET id_categoria = ?, nom_subcat = ?, estado_subcat = ?
            WHERE id_subcategoria = ?`, [id_categoria, nom_subcat, estado_subcat, id_subcategoria]);

        const [resultCat] = await connection.query(`
            UPDATE categoria 
            SET nom_categoria = ?, estado_categoria = ?
            WHERE id_categoria = ?`, [nom_categoria, estado_categoria, id_categoria]);

        if (resultSubCat.affectedRows === 0 && resultCat.affectedRows === 0) {
            return res.status(404).json({ message: "Subcategoría o categoría no encontrada" });
        }

        res.json({ message: "Subcategoría y categoría actualizadas con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};



const deactivateSubCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE sub_categoria SET estado_subcat = 0 WHERE id_subcategoria = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Subcategoría no encontrada" });
        }

        res.json({ code: 1, message: "Subcategoría dada de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error al dar de baja la subcategoría", error: error.message });
        }
    }
};


const deleteSubCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await getConnection();
        const [result] = await connection.query(
            "DELETE FROM sub_categoria WHERE id_subcategoria = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Subcategoría no encontrada" });
        }

        res.json({ code: 1, message: "Subcategoría eliminada con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error al eliminar la subcategoría", error: error.message });
        }
    }
};



const getSubcategoriasConCategoria = async (req, res) => {
    try {
      const connection = await getConnection();
  
      const query = `
        SELECT 
          sc.id_subcategoria, 
          sc.nom_subcat, 
          sc.estado_subcat,
          c.nom_categoria,
          c.estado_categoria
        FROM 
          sub_categoria sc
        JOIN 
          categoria c 
        ON 
          sc.id_categoria = c.id_categoria
      `;
  
      const [result] = await connection.query(query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener las subcategorías con sus categorías", error });
    }
  };
  
  
export const methods = {
    getSubCategorias,
    getSubcategoriesForCategory,
    getSubcategoriasConCategoria,
    getSubCategoria,
    addSubCategoria,
    updateSubCategoria,
    deactivateSubCategoria,
    deleteSubCategoria
};

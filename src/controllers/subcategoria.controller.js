import { getConnection } from "./../database/database.js";

// Cache compartido (mismo que marcas y categorías)
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

const getSubCategorias = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
            WHERE id_tenant = ?
            ORDER BY nom_subcat ASC
            LIMIT 200
        `, [req.id_tenant]);
        res.json({ code: 1, data: result, message: "Subcategorías listadas" });
    } catch (error) {
        console.error('Error en getSubCategorias:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getSubcategoriesForCategory = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
            WHERE id_categoria = ? AND id_tenant = ?
            ORDER BY nom_subcat ASC
            LIMIT 200
        `, [id, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, data: result, message: "Subcategorías de categoría no encontradas" });
        }

        res.json({ code: 1, data: result, message: "Subcategorías de categoría listadas" });
    } catch (error) {
        console.error('Error en getSubcategoriesForCategory:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getSubCategoria = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_subcategoria, id_categoria, nom_subcat, estado_subcat
            FROM sub_categoria
            WHERE id_subcategoria = ? AND id_tenant = ?
            LIMIT 1`, [id, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Subcategoría no encontrada" });
        }

        res.json({ data: result, message: "Subcategoría encontrada" });
    } catch (error) {
        console.error('Error en getSubCategoria:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const addSubCategoria = async (req, res) => {
    let connection;
    try {
        let { id_categoria, nom_subcat, estado_subcat } = req.body;

        id_categoria = Number(id_categoria);
        estado_subcat = Number(estado_subcat);

        if (
            isNaN(id_categoria) ||
            typeof nom_subcat !== 'string' ||
            nom_subcat.trim() === '' ||
            isNaN(estado_subcat)
        ) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const subcategoria = { id_categoria, nom_subcat: nom_subcat.trim(), estado_subcat, id_tenant: req.id_tenant };
        connection = await getConnection();
        await connection.query("INSERT INTO sub_categoria SET ? ", subcategoria);
        const [idAdd] = await connection.query("SELECT id_subcategoria FROM sub_categoria WHERE nom_subcat = ? AND id_tenant = ?", [nom_subcat, req.id_tenant]);

        // Limpiar caché
        queryCache.clear();

        res.status(201).json({ code: 1, message: "Subcategoría añadida con éxito", id: idAdd[0].id_subcategoria });
    } catch (error) {
        console.error('Error en addSubCategoria:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateSubCategoria = async (req, res) => {
    let connection;
    try {
        const { id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria } = req.body;

        if (id_categoria === undefined) {
            return res.status(400).json({ message: "ID de categoría es requerido" });
        }

        connection = await getConnection();

        const [resultSubCat] = await connection.query(`
            UPDATE sub_categoria 
            SET id_categoria = ?, nom_subcat = ?, estado_subcat = ?
            WHERE id_subcategoria = ? AND id_tenant = ?`, [id_categoria, nom_subcat, estado_subcat, id_subcategoria, req.id_tenant]);

        const [resultCat] = await connection.query(`
            UPDATE categoria 
            SET nom_categoria = ?, estado_categoria = ?
            WHERE id_categoria = ? AND id_tenant = ?`, [nom_categoria, estado_categoria, id_categoria, req.id_tenant]);

        if (resultSubCat.affectedRows === 0 && resultCat.affectedRows === 0) {
            return res.status(404).json({ message: "Subcategoría o categoría no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ message: "Subcategoría y categoría actualizadas con éxito" });
    } catch (error) {
        console.error('Error en updateSubCategoria:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deactivateSubCategoria = async (req, res) => {
    let connection;
    const { id } = req.params;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE sub_categoria SET estado_subcat = 0 WHERE id_subcategoria = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Subcategoría no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Subcategoría dada de baja con éxito" });
    } catch (error) {
        console.error('Error en deactivateSubCategoria:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteSubCategoria = async (req, res) => {
    let connection;
    const { id } = req.params;
    try {
        connection = await getConnection();

        // Check for dependencies in 'producto'
        const [products] = await connection.query("SELECT 1 FROM producto WHERE id_subcategoria = ? AND id_tenant = ? LIMIT 1", [id, req.id_tenant]);

        if (products.length > 0) {
            return res.status(409).json({ code: 0, message: "No se puede eliminar la subcategoría porque está asociada a productos." });
        }

        const [result] = await connection.query(
            "DELETE FROM sub_categoria WHERE id_subcategoria = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Subcategoría no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Subcategoría eliminada con éxito" });
    } catch (error) {
        console.error('Error en deleteSubCategoria:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getSubcategoriasConCategoria = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

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
        WHERE sc.id_tenant = ? AND c.id_tenant = ?
      `;

        const [result] = await connection.query(query, [req.id_tenant, req.id_tenant]);
        res.json(result);
    } catch (error) {
        console.error('Error en getSubcategoriasConCategoria:', error);
        res.status(500).json({ message: "Error al obtener las subcategorías con sus categorías" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const importExcel = async (req, res) => {
    let connection;
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "No data provided or invalid format" });
        }

        if (data.length > 500) {
            return res.status(400).json({ message: "Limit exceeded. Max 500 rows allowed." });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        let insertedCount = 0;
        let errors = [];

        for (const [index, item] of data.entries()) {
            if (!item.nom_subcat || !item.id_categoria) {
                errors.push(`Row ${index + 1}: Missing required fields`);
                continue;
            }

            const subcategoria = {
                id_categoria: item.id_categoria,
                nom_subcat: item.nom_subcat.trim(),
                estado_subcat: item.estado_subcat !== undefined ? item.estado_subcat : 1,
                id_tenant: req.id_tenant
            };

            try {
                await connection.query("INSERT INTO sub_categoria SET ?", subcategoria);
                insertedCount++;
            } catch (err) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        }

        await connection.commit();

        // Clear cache
        queryCache.clear();

        res.json({
            code: 1,
            message: `Import completed. ${insertedCount} inserted.`,
            inserted: insertedCount,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en importExcel:', error);
        res.status(500).json({ code: 0, message: "Internal Server Error" });
    } finally {
        if (connection) connection.release();
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
    deleteSubCategoria,
    importExcel
};

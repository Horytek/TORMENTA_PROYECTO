import { getConnection } from "./../database/database.js";

// Cache compartido para productos, marcas, categorías y subcategorías
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

const getMarcas = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
        const rawLimit = Math.max(parseInt(req.query.limit ?? '100', 10) || 100, 1);
        const limit = Math.min(rawLimit, 200);
        const offset = (page - 1) * limit;

        const allowedSort = { id_marca: 'id_marca', nom_marca: 'nom_marca', estado_marca: 'estado_marca' };
        const sortBy = allowedSort[req.query.sortBy] || allowedSort.nom_marca;
        const sortDir = (String(req.query.sortDir || 'ASC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

        const { nom_marca, estado_marca } = req.query;
        const whereClauses = ['id_tenant = ?'];
        const params = [req.id_tenant];
        if (nom_marca) { whereClauses.push('nom_marca = ?'); params.push(String(nom_marca).trim()); }
        if (typeof estado_marca !== 'undefined' && estado_marca !== '') { whereClauses.push('estado_marca = ?'); params.push(estado_marca); }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        const [result] = await connection.query(
            `SELECT id_marca, nom_marca, estado_marca
             FROM marca
             ${whereSQL}
             ORDER BY ${sortBy} ${sortDir}
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
        console.error('Error en getMarcas:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getMarca = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
            WHERE id_marca = ? AND id_tenant = ?
            LIMIT 1`, [id, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Marca no encontrada" });
        }

        res.json({ data: result, message: "Marca encontrada" });
    } catch (error) {
        console.error('Error en getMarca:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const addMarca = async (req, res) => {
    let connection;
    try {
        const { nom_marca, estado_marca } = req.body;

        if (typeof nom_marca !== 'string' || nom_marca.trim() === '' || typeof estado_marca !== 'number') {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const marca = { nom_marca: nom_marca.trim(), estado_marca, id_tenant: req.id_tenant };
        connection = await getConnection();
        await connection.query("INSERT INTO marca SET ? ", marca);

        const [idAdd] = await connection.query("SELECT id_marca FROM marca WHERE nom_marca = ? AND id_tenant = ?", [nom_marca, req.id_tenant]);

        // Limpiar caché
        queryCache.clear();

        res.status(201).json({ code: 1, message: "Marca añadida con éxito", id: idAdd[0].id_marca });
    } catch (error) {
        console.error('Error en addMarca:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateMarca = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nom_marca, estado_marca } = req.body;

        connection = await getConnection();
        const [result] = await connection.query(`
            UPDATE marca 
            SET nom_marca = ?, estado_marca = ?
            WHERE id_marca = ? AND id_tenant = ?`, [nom_marca, estado_marca, id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Marca no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ message: "Marca actualizada con éxito" });
    } catch (error) {
        console.error('Error en updateMarca:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deactivateMarca = async (req, res) => {
    let connection;
    const { id } = req.params;
    try {
        connection = await getConnection();
        const [result] = await connection.query("UPDATE marca SET estado_marca = 0 WHERE id_marca = ? AND id_tenant = ?", [id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Marca no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ message: "Marca dada de baja con éxito" });
    } catch (error) {
        console.error('Error en deactivateMarca:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteMarca = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("DELETE FROM marca WHERE id_marca = ? AND id_tenant = ?", [id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Marca no encontrada" });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Marca eliminada" });
    } catch (error) {
        console.error('Error en deleteMarca:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
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
            if (!item.nom_marca) {
                errors.push(`Row ${index + 1}: Missing required fields`);
                continue;
            }

            const marca = {
                nom_marca: item.nom_marca.trim(),
                estado_marca: item.estado_marca !== undefined ? item.estado_marca : 1,
                id_tenant: req.id_tenant
            };

            try {
                await connection.query("INSERT INTO marca SET ?", marca);
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
    getMarcas,
    getMarca,
    addMarca,
    updateMarca,
    deactivateMarca,
    deleteMarca,
    importExcel
};

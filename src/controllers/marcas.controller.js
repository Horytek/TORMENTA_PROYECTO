import { getConnection } from "./../database/database.js";

const getMarcas = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
            WHERE id_tenant = ?
        `, [req.id_tenant]);
        res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }   finally {
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
            WHERE id_marca = ? AND id_tenant = ?`, [id, req.id_tenant]);
        
        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Marca no encontrada" });
        }

        res.json({ data: result, message: "Marca encontrada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }   finally {
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

        res.status(201).json({ code: 1, message: "Marca añadida con éxito", id: idAdd[0].id_marca });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }   finally {
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

        res.json({ message: "Marca actualizada con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }    finally {
        if (connection) {
            connection.release();
        }
    }
};

const deactivateMarca = async (req, res) => {
    let connection;
    const { id } = req.params;
    connection = await getConnection();
    try {
        const [result] = await connection.query("UPDATE marca SET estado_marca = 0 WHERE id_marca = ? AND id_tenant = ?", [id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Marca no encontrada" });
        }

        res.json({ message: "Marca dada de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }    finally {
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

        res.json({ code: 1, message: "Marca eliminada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }     finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getMarcas,
    getMarca,
    addMarca,
    updateMarca,
    deactivateMarca,
    deleteMarca
};
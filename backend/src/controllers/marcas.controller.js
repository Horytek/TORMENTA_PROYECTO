import { getConnection } from "./../database/database";

const getMarcas = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
        `);
        res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const getMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
            WHERE id_marca = ?`, [id]);
        
        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Marca no encontrada" });
        }

        res.json({ data: result, message: "Marca encontrada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const addMarca = async (req, res) => {
    try {
        const { nom_marca, estado_marca } = req.body;

        if (typeof nom_marca !== 'string' || nom_marca.trim() === '' || typeof estado_marca !== 'number') {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const marca = { nom_marca: nom_marca.trim(), estado_marca };
        const connection = await getConnection();
        await connection.query("INSERT INTO marca SET ? ", marca);

        const [idAdd] = await connection.query("SELECT id_marca FROM marca WHERE nom_marca = ?", nom_marca);

        res.status(201).json({ code: 1, message: "Marca añadida con éxito", id: idAdd[0].id_marca });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

const updateMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_marca, estado_marca } = req.body;

        const connection = await getConnection();
        const [result] = await connection.query(`
            UPDATE marca 
            SET nom_marca = ?, estado_marca = ?
            WHERE id_marca = ?`, [nom_marca, estado_marca, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Marca no encontrada" });
        }

        res.json({ message: "Marca actualizada con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};





const deactivateMarca = async (req, res) => {
    const { id } = req.params;
    const connection = await getConnection();
    try {
        const [result] = await connection.query("UPDATE marca SET estado_marca = 0 WHERE id_marca = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Marca no encontrada" });
        }

        res.json({ message: "Marca dada de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};


const deleteMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("DELETE FROM marca WHERE id_marca = ?", [id]);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Marca no encontrada" });
        }

        res.json({ code: 1, message: "Marca eliminada" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
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

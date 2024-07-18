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

        // Validación de los campos requeridos
        if (typeof nom_marca !== 'string' || nom_marca.trim() === '' || typeof estado_marca !== 'number') {
            return res.status(400).json({ message: "Bad Request. Please fill all fields correctly." });
        }

        const marca = { nom_marca: nom_marca.trim(), estado_marca };
        const connection = await getConnection();
        await connection.query("INSERT INTO marca SET ? ", marca);

        res.status(201).json({ message: "Marca añadida con éxito" });
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

        if (nom_marca === undefined || estado_marca === undefined) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        const marca = { nom_marca, estado_marca };
        const connection = await getConnection();
        const [result] = await connection.query("UPDATE marca SET ? WHERE id_marca = ?", [marca, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Marca no encontrada" });
        }

        res.json({ code: 1, message: "Marca actualizada" });
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
    deleteMarca
};

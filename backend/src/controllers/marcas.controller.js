import { getConnection } from "./../database/database";

const getMarcas = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
        `);
        res.json({code: 1, data: result, message: "Marcas listadas"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const getMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
            SELECT id_marca, nom_marca, estado_marca
            FROM marca
            WHERE id_marca = ?`, id);
        
        if (result.length === 0) {
            return res.status(404).json({data: result, message: "Marca no encontrada"});
        }

        res.json({data: result, message: "Marca encontrada"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const addMarca = async (req, res) => {
    try {
        const { nom_marca, estado_marca } = req.body;

        if (nom_marca === undefined || estado_marca === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        const marca = { nom_marca, estado_marca };
        const connection = await getConnection();
        await connection.query("INSERT INTO marca SET ? ", marca);

        res.json({ message: "Marca añadida" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const updateMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_marca, estado_marca } = req.body;

        if (nom_marca === undefined || estado_marca === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        const marca = { nom_marca, estado_marca };
        const connection = await getConnection();
        const [result] = await connection.query("UPDATE marca SET ? WHERE id_marca = ?", [marca, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Marca no encontrada"});
        }

        res.json({code: 1, message: "Marca actualizada"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const deleteMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query("DELETE FROM marca WHERE id_marca = ?", id);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Marca no encontrada"});
        }

        res.json({code: 1, message: "Marca eliminada"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

export const methods = {
    getMarcas,
    getMarca,
    addMarca,
    updateMarca,
    deleteMarca
};

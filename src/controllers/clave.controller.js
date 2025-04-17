import { getConnection } from "./../database/database";

const getClaves = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT CL.*, EM.razonSocial 
            FROM clave CL
            INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
            ORDER BY CL.id_clave DESC
        `);
        res.json({ code: 1, data: result, message: "Claves listadas" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const getClave = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM clave WHERE id_clave = ?", id);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "Clave no encontrada" });
        }

        res.json({ code: 1, data: result, message: "Clave encontrada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const addClave = async (req, res) => {
    let connection;
    try {
        const { id_empresa, tipo, valor, estado_clave } = req.body;

        if (!id_empresa) return res.status(400).json({ message: "El campo id_empresa es obligatorio." });

        const clave = { id_empresa, tipo, valor, estado_clave };
        connection = await getConnection();
        await connection.query("INSERT INTO clave SET ?", clave);

        res.json({ code: 1, message: "Clave añadida" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const updateClave = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_empresa, tipo, valor, estado_clave } = req.body;

        const clave = { id_empresa, tipo, valor, estado_clave };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE clave SET ? WHERE id_clave = ?", [clave, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Clave no encontrada" });
        }

        res.json({ code: 1, message: "Clave actualizada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const deleteClave = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("DELETE FROM clave WHERE id_clave = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Clave no encontrada" });
        }

        res.json({ code: 1, message: "Clave eliminada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getClaves,
    getClave,
    addClave,
    updateClave,
    deleteClave,
};
 
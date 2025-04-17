import { getConnection } from "./../database/database";

const getEmpresas = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM empresa ORDER BY id_empresa DESC");
        res.json({ code: 1, data: result, message: "Empresas listadas" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const getEmpresa = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM empresa WHERE id_empresa = ?", id);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }

        res.json({ code: 1, data: result, message: "Empresa encontrada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const addEmpresa = async (req, res) => {
    let connection;
    try {
        const { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email } = req.body;

        if (!ruc) return res.status(400).json({ message: "El campo RUC es obligatorio." });

        const empresa = { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email };
        connection = await getConnection();
        await connection.query("INSERT INTO empresa SET ?", empresa);

        res.json({ code: 1, message: "Empresa añadida" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const updateEmpresa = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email } = req.body;

        const empresa = { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE empresa SET ? WHERE id_empresa = ?", [empresa, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }

        res.json({ code: 1, message: "Empresa modificada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const deleteEmpresa = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("DELETE FROM empresa WHERE id_empresa = ?", id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }

        res.json({ code: 1, message: "Empresa eliminada" });
    } catch (error) {
        res.status(500).send({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getEmpresas,
    getEmpresa,
    addEmpresa,
    updateEmpresa,
    deleteEmpresa,
};

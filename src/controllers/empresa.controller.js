import { getConnection } from "./../database/database.js";

const getEmpresas = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query("SELECT * FROM empresa ORDER BY id_empresa DESC");
        res.json({ code: 1, data: result, message: "Empresas listadas" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const addEmpresa = async (req, res) => {
    let connection;
    try {
        const {
            ruc, razonSocial, nombreComercial, direccion,
            distrito, provincia, departamento, codigoPostal,
            telefono, email, logotipo, moneda, pais, plan_pago
        } = req.body;

        // Validaciones mínimas (solo campos esenciales)
        if (!ruc || !razonSocial || !direccion) {
            return res.status(400).json({ code: 0, message: "Campos requeridos: ruc, razonSocial, direccion" });
        }

        const rucTrim = String(ruc).trim();
        if (!/^\d{11}$/.test(rucTrim)) {
            return res.status(400).json({ code: 0, message: "RUC inválido (11 dígitos numéricos)" });
        }

        // Normalización básica
        const sanitize = (v) => (typeof v === "string" ? v.trim() : v ?? null);
        const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

        connection = await getConnection();

        // Evitar duplicado por RUC
        const [dup] = await connection.query(
            "SELECT id_empresa FROM empresa WHERE ruc = ? LIMIT 1",
            [rucTrim]
        );
        if (dup.length > 0) {
            return res.status(400).json({ code: 0, message: "Ya existe una empresa registrada con ese RUC" });
        }

        const empresa = {
            ruc: rucTrim,
            razonSocial: sanitize(razonSocial),
            nombreComercial: sanitize(nombreComercial) || sanitize(razonSocial), // usar razón social si no hay nombre comercial
            direccion: sanitize(direccion),
            distrito: sanitize(distrito) || null,
            provincia: sanitize(provincia) || null,
            departamento: sanitize(departamento) || null,
            codigoPostal: sanitize(codigoPostal) || null,
            telefono: sanitize(telefono) || null,
            email: sanitize(email) || null,
            logotipo: isHttpUrl(logotipo) ? sanitize(logotipo) : null,
            moneda: sanitize(moneda) || "PEN", // default Soles
            pais: sanitize(pais) || "Perú" // default Perú
        };

        const [result] = await connection.query("INSERT INTO empresa SET ?", empresa);
        return res.json({ code: 1, message: "Empresa añadida", id_empresa: result.insertId });
    } catch (error) {
        console.error("Error en addEmpresa:", error);
        return res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};


const updateEmpresa = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const body = req.body;

        // Solo incluir campos que fueron enviados (no undefined)
        const allowedFields = ['ruc', 'razonSocial', 'nombreComercial', 'direccion', 'distrito',
            'provincia', 'departamento', 'codigoPostal', 'telefono', 'email', 'logotipo', 'moneda', 'pais'];

        const empresa = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                empresa[field] = body[field];
            }
        }

        // Si no hay campos para actualizar
        if (Object.keys(empresa).length === 0) {
            return res.status(400).json({ code: 0, message: "No hay campos para actualizar" });
        }

        connection = await getConnection();
        const [result] = await connection.query("UPDATE empresa SET ? WHERE id_empresa = ?", [empresa, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }

        res.json({ code: 1, message: "Empresa modificada" });
    } catch (error) {
        console.error("Error en updateEmpresa:", error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const updateEmpresaMonedas = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { monedas, pais } = req.body; // ahora recibe también el país
        if (!monedas) {
            return res.status(400).json({ code: 0, message: "El campo monedas es obligatorio." });
        }
        if (!pais) {
            return res.status(400).json({ code: 0, message: "El campo país es obligatorio." });
        }
        connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE empresa SET moneda = ?, pais = ? WHERE id_empresa = ?",
            [monedas, pais, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }
        res.json({ code: 1, message: "Monedas y país actualizados correctamente" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
    updateEmpresaMonedas,
};

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
      telefono, email, logotipo, moneda, pais
    } = req.body;

    // Validaciones mínimas
    if (!ruc || !razonSocial || !direccion || !pais) {
      return res.status(400).json({ code: 0, message: "Campos requeridos: ruc, razonSocial, direccion, pais" });
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
      nombreComercial: sanitize(nombreComercial),
      direccion: sanitize(direccion),
      distrito: sanitize(distrito),
      provincia: sanitize(provincia),
      departamento: sanitize(departamento),
      codigoPostal: sanitize(codigoPostal),
      telefono: sanitize(telefono),
      email: sanitize(email),
      // Guardar logotipo como texto (URL) o null si no es http/https
      logotipo: isHttpUrl(logotipo) ? sanitize(logotipo) : null,
      moneda: sanitize(moneda) || null,
      pais: sanitize(pais)
      //id_tenant: req.id_tenant || null, // habilítalo si decides enlazar al tenant
    };

    const [result] = await connection.query("INSERT INTO empresa SET ?", empresa);
    return res.json({ code: 1, message: "Empresa añadida", id_empresa: result.insertId });
  } catch (error) {
    return res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const updateEmpresa = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email, logotipo } = req.body;

        const empresa = { ruc, razonSocial, nombreComercial, direccion, distrito, provincia, departamento, codigoPostal, telefono, email, logotipo };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE empresa SET ? WHERE id_empresa = ?", [empresa, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Empresa no encontrada" });
        }

        res.json({ code: 1, message: "Empresa modificada" });
    } catch (error) {
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

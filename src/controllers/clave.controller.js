import { getConnection } from "./../database/database.js";
import { encrypt, decrypt } from "./../utils/cryptoUtil.js";

// Utilidad para saber si el usuario es desarrollador
function isDeveloperUser(req) {
  const user = req.user || {};
  return user.rol === 10 || user.nameUser === 'desarrollador';
}

const getClaves = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const developer = isDeveloperUser(req);

    let query, params;
    if (developer) {
      query = `
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        ORDER BY CL.id_clave DESC
      `;
      params = [];
    } else {
      query = `
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        WHERE CL.id_tenant = ?
        ORDER BY CL.id_clave DESC
      `;
      params = [req.id_tenant];
    }

    const [result] = await connection.query(query, params);

    const clavesDesencriptadas = result.map(clave => ({
      ...clave,
      valor: decrypt(clave.valor),
    }));

    res.json({ code: 1, data: clavesDesencriptadas, message: "Claves listadas" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getClave = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const developer = isDeveloperUser(req);

    let query, params;
    if (developer) {
      query = "SELECT * FROM clave WHERE id_clave = ?";
      params = [id];
    } else {
      query = "SELECT * FROM clave WHERE id_clave = ? AND id_tenant = ?";
      params = [id, req.id_tenant];
    }

    const [result] = await connection.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ code: 0, message: "Clave no encontrada" });
    }

    const clave = {
      ...result[0],
      valor: decrypt(result[0].valor),
    };

    res.json({ code: 1, data: clave, message: "Clave encontrada" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const addClave = async (req, res) => {
  let connection;
  try {
    const { id_empresa, tipo = 'Sunat', valor, estado_clave = 1 } = req.body;
    if (!id_empresa) return res.status(400).json({ code: 0, message: "El campo id_empresa es obligatorio." });
    if (!valor)      return res.status(400).json({ code: 0, message: "El campo valor (token) es obligatorio." });

    const developer = isDeveloperUser(req);
    const valorEncriptado = encrypt(valor);

    connection = await getConnection();
    await connection.beginTransaction();

    // 1) Verificar si ya existe la clave Sunat de esa empresa (y tenant)
    let selectQuery = `
      SELECT id_clave 
      FROM clave 
      WHERE id_empresa = ? AND tipo = ?
    `;
    const selectParams = [id_empresa, tipo];
    if (!developer) {
      selectQuery += " AND id_tenant = ?";
      selectParams.push(req.id_tenant);
    }
    const [rows] = await connection.query(selectQuery, selectParams);

    let result;
    if (rows.length > 0) {
      // 2) Actualizar si existe
      [result] = await connection.query(
        "UPDATE clave SET valor = ?, estado_clave = ? WHERE id_clave = ?",
        [valorEncriptado, estado_clave, rows[0].id_clave]
      );
    } else {
      // 3) Insertar si no existe
      const clave = {
        id_empresa,
        tipo,
        valor: valorEncriptado,
        estado_clave,
        id_tenant: req.id_tenant
      };
      [result] = await connection.query("INSERT INTO clave SET ? ", clave);
    }

    await connection.commit();
    return res.json({ code: 1, message: "Clave guardada correctamente" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en addClave:', { code: error.code, msg: error.sqlMessage || error.message });

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 0, message: "Ya existe una clave Sunat para esta empresa" });
    }
    if ((error.sqlMessage || "").includes("Data too long")) {
      return res.status(400).json({ 
        code: 0, 
        message: "El token es demasiado largo para la columna 'valor'. Aumenta el tamaño a TEXT/LONGTEXT." 
      });
    }
    return res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const updateClave = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { id_empresa, tipo, valor, estado_clave } = req.body;
    const developer = isDeveloperUser(req);

    const clave = {
      id_empresa,
      tipo,
      valor: encrypt(valor),
      estado_clave,
      id_tenant: req.id_tenant
    };

    connection = await getConnection();

    let query, params;
    if (developer) {
      query = "UPDATE clave SET ? WHERE id_clave = ?";
      params = [clave, id];
    } else {
      query = "UPDATE clave SET ? WHERE id_clave = ? AND id_tenant = ?";
      params = [clave, id, req.id_tenant];
    }

    const [result] = await connection.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 0, message: "Clave no encontrada" });
    }

    res.json({ code: 1, message: "Clave actualizada" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const deleteClave = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const developer = isDeveloperUser(req);

    connection = await getConnection();

    let query, params;
    if (developer) {
      query = "DELETE FROM clave WHERE id_clave = ?";
      params = [id];
    } else {
      query = "DELETE FROM clave WHERE id_clave = ? AND id_tenant = ?";
      params = [id, req.id_tenant];
    }

    const [result] = await connection.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 0, message: "Clave no encontrada" });
    }

    res.json({ code: 1, message: "Clave eliminada" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getClaveByEmpresaAndTipo = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const developer = isDeveloperUser(req);

    connection = await getConnection();

    let query, params;
    if (developer) {
      query = `
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        WHERE CL.id_empresa = ? AND CL.tipo = 'Sunat'
      `;
      params = [id];
    } else {
      query = `
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        WHERE CL.id_empresa = ? AND CL.tipo = 'Sunat' AND CL.id_tenant = ?
      `;
      params = [id, req.id_tenant];
    }

    const [result] = await connection.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ code: 0, message: "Clave no encontrada" });
    }

    const clave = {
      ...result[0],
      valor: decrypt(result[0].valor),
    };

    res.json({ code: 1, data: clave, message: "Clave encontrada" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
  getClaveByEmpresaAndTipo,
};
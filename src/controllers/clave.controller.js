import { getConnection } from "./../database/database";
import { encrypt, decrypt } from "./../utils/cryptoUtil"; // Ruta según tu estructura

const getClaves = async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        WHERE CL.id_tenant = ?
        ORDER BY CL.id_clave DESC
      `, [req.id_tenant]);
  
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
      const [result] = await connection.query(
        "SELECT * FROM clave WHERE id_clave = ? AND id_tenant = ?",
        [id, req.id_tenant]
      );
  
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
      const { id_empresa, tipo, valor, estado_clave } = req.body;

      if (!id_empresa) return res.status(400).json({ message: "El campo id_empresa es obligatorio." });

      const clave = {
        id_empresa,
        tipo,
        valor: encrypt(valor),
        estado_clave,
        id_tenant: req.id_tenant
      };

      connection = await getConnection();
      await connection.query("INSERT INTO clave SET ?", clave);

      res.json({ code: 1, message: "Clave añadida" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
      if (connection) connection.release();
    }
};

const updateClave = async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      const { id_empresa, tipo, valor, estado_clave } = req.body;

      const clave = {
        id_empresa,
        tipo,
        valor: encrypt(valor),
        estado_clave,
        id_tenant: req.id_tenant
      };

      connection = await getConnection();
      const [result] = await connection.query(
        "UPDATE clave SET ? WHERE id_clave = ? AND id_tenant = ?",
        [clave, id, req.id_tenant]
      );

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
        connection = await getConnection();
        const [result] = await connection.query(
          "DELETE FROM clave WHERE id_clave = ? AND id_tenant = ?",
          [id, req.id_tenant]
        );

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
    connection = await getConnection();
    const [result] = await connection.query(`
        SELECT CL.*, EM.razonSocial 
        FROM clave CL
        INNER JOIN empresa EM ON CL.id_empresa = EM.id_empresa
        WHERE CL.id_empresa = ? AND CL.tipo = 'Sunat' AND CL.id_tenant = ?
      `, [id, req.id_tenant]);

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
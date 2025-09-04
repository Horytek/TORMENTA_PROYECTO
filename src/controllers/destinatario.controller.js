import { getConnection } from "../database/database.js";

// INSERTAR DESTINATARIO 
const insertDestinatario = async (req, res) => {
  let connection;
  const {
    ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, telefono, email
  } = req.body;

  if (!ubicacion) {
    return res
      .status(400)
      .json({ message: "Bad Request. Please fill all fields correctly." });
  }

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      "INSERT INTO destinatario (ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, email, telefono, id_tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, email, telefono, req.id_tenant]
    );
    res.json({ code: 1, message: 'Destinatario insertado correctamente', id: result.insertId });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// INSERTAR DESTINATARIO NATURAL
const addDestinatarioNatural = async (req, res) => {
  let connection;
  const {
    dni,
    nombres,
    apellidos,
    ubicacion,
    direccion = "",
    email = "",
    telefono = ""
  } = req.body;

  if (!dni || !nombres || !apellidos || !ubicacion) {
    return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
  }

  try {
    connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO destinatario (dni, nombres, apellidos, ubicacion, direccion, email, telefono, id_tenant) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dni, nombres, apellidos, ubicacion, direccion || "", email || "", telefono || "", req.id_tenant]
    );
    res.json({ code: 1, data: result, message: "Destinatario natural añadido exitosamente" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// INSERTAR DESTINATARIO JURÍDICO
const addDestinatarioJuridico = async (req, res) => {
  let connection;
  const {
    ruc,
    razon_social,
    ubicacion,
    direccion = "",
    email = "",
    telefono = ""
  } = req.body;

  if (!ruc || !razon_social || !ubicacion) {
    return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
  }

  try {
    connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO destinatario (ruc, razon_social, ubicacion, direccion, email, telefono, id_tenant) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ruc, razon_social, ubicacion, direccion || "", email || "", telefono || "", req.id_tenant]
    );
    res.json({ code: 1, data: result, message: "Destinatario jurídico añadido exitosamente" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updateDestinatarioNatural = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      dni = "",
      nombres = "",
      apellidos = "",
      telefono = "",
      direccion = "",
      ubicacion = "",
      email = ""
    } = req.body;

    if (!dni || !nombres || !apellidos || !ubicacion) {
      return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }

    connection = await getConnection();
    const [result] = await connection.query(
      `UPDATE destinatario
       SET dni = ?, nombres = ?, apellidos = ?, telefono = ?, direccion = ?, ubicacion = ?, email = ?
       WHERE id_destinatario = ? AND id_tenant = ?`,
      [dni, nombres, apellidos, telefono, direccion, ubicacion, email, id, req.id_tenant]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "No se realizó ninguna actualización" });
    }
    res.json({ message: "Destinatario natural actualizado con éxito" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const updateDestinatarioJuridico = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      ruc = "",
      razon_social = "",
      telefono = "",
      direccion = "",
      ubicacion = "",
      email = ""
    } = req.body;

    if (!ruc || !razon_social || !ubicacion) {
      return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }

    connection = await getConnection();
    const [result] = await connection.query(
      `UPDATE destinatario
       SET ruc = ?, razon_social = ?, ubicacion = ?, direccion = ?, email = ?, telefono = ?
       WHERE id_destinatario = ? AND id_tenant = ?`,
      [ruc, razon_social, ubicacion, direccion, email, telefono, id, req.id_tenant]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "No se realizó ninguna actualización" });
    }
    res.json({ message: "Destinatario jurídico actualizado con éxito" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getDestinatarios = async (req, res) => {
  let connection;
  try {
      connection = await getConnection();
      const [result] = await connection.query(`
                          SELECT 
  id_destinatario AS id,
  COALESCE(NULLIF(dni, ''), ruc) AS documento, 
  COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
  ubicacion,
  direccion,
    email,
    telefono 
FROM 
  destinatario
WHERE 
  id_tenant = ?
  AND (
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
    OR
    (razon_social IS NOT NULL AND razon_social <> '')
  )
ORDER BY 
  (CASE 
      WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
      ELSE 1 
   END),
  destinatario;
          `, [req.id_tenant]);
      res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
      if (connection) {
          connection.release();
      }
  }
};

const getDestinatario = async (req, res) => {
  let connection;
  try {
      const { id } = req.params;

      if (!id) {
          return res.status(400).json({ message: "Debe proporcionar un ID" });
      }

      connection = await getConnection();
      const [result] = await connection.query(
          `SELECT 
              id_destinatario AS id,
              COALESCE(NULLIF(dni, ''), ruc) AS documento, 
              COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
              ubicacion,
              direccion,
              email,
              telefono 
          FROM 
              destinatario
          WHERE 
              COALESCE(NULLIF(dni, ''), ruc) = ? AND id_tenant = ?
          ORDER BY 
              (CASE 
                  WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
                  ELSE 1 
              END),
              destinatario;`,
          [id, req.id_tenant]
      );

      if (result.length === 0) {
          return res.status(404).json({ data: [], message: "Destinatario no encontrado" });
      }

      res.json({ code: 1, data: result, message: "Destinatario encontrado" });
  } catch (error) {
      if (!res.headersSent) {
          res.status(500).json({ code: 0, message: "Error interno del servidor" });
      }
  } finally {
      if (connection) connection.release();
  }
};

const deleteDestinatario = async (req, res) => {
  let connection;
  try {
      const { id } = req.params;

      connection = await getConnection();

      // Eliminar por id_destinatario (id numérico)
      const [result] = await connection.query("DELETE FROM destinatario WHERE id_destinatario = ? AND id_tenant = ?", [id, req.id_tenant]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ code: 0, message: "Destinatario no encontrado" });
      }

      res.json({ code: 1, message: "Destinatario eliminado" });
  } catch (error) {
      if (!res.headersSent) {
          res.status(500).json({ code: 0, message: "Error interno del servidor" });
      }
  } finally {
      if (connection) connection.release();
  }
};

export const methods = {
  insertDestinatario,
  addDestinatarioNatural,
  addDestinatarioJuridico,
  deleteDestinatario,
  getDestinatarios,
  getDestinatario,
  updateDestinatarioNatural,
  updateDestinatarioJuridico
};
import { getConnection } from "../database/database";

// INSERTAR DESTINATARIO 
const insertDestinatario = async (req, res) => {
  let connection;
  const {
    ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, telefono, email
  } = req.body;

  console.log("Datos recibidos:", req.body);
  console.log("Datos recibidos:", {
    ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, telefono, email
  });
  if (
    !ubicacion
  ) {
    console.log("Error en los datos:", {
      ubicacion,
    });
    return res
      .status(400)
      .json({ message: "Bad Request. Please fill all fields correctly." });
  }

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      "INSERT INTO destinatario (ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, email, telefono) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)",
      [ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, email, telefono]
    );
    console.log(result);
    res.json({ code: 1, message: 'Destinatario insertado correctamente', id: result.insertId });
  } catch (error) {
    console.error("Error en el backend:", error.message);
    res.status(500).send({ code: 0, message: error.message });
  } finally {
    if (connection) {
      connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
  }
};

// INSERTAR DESTINATARIO NATURAL
const addDestinatarioNatural = async (req, res) => {
  let connection;
  const { dni, nombres, apellidos, ubicacion } = req.body;

  if (!dni || !nombres || !apellidos || !ubicacion) {
    return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
  }

  try {
    connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO destinatario (dni, nombres, apellidos, ubicacion) 
           VALUES (?, ?, ?, ?)`,
      [dni, nombres, apellidos, ubicacion]
    );
    res.json({ code: 1, data: result, message: "Destinatario natural añadido exitosamente" });
  } catch (error) {
    res.status(500).send({ code: 0, message: error.message });
  } finally {
    if (connection) {
      connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
  }
};


// INSERTAR DESTINATARIO JURÍDICO
const addDestinatarioJuridico = async (req, res) => {
  let connection;
  const { ruc, razon_social, ubicacion } = req.body;

  if (!ruc || !razon_social || !ubicacion) {
    return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
  }

  try {
    connection = await getConnection();
    const result = await connection.query(
      `INSERT INTO destinatario (ruc, razon_social, ubicacion) 
           VALUES (?, ?, ?)`,
      [ruc, razon_social, ubicacion]
    );
    res.json({ code: 1, data: result, message: "Destinatario jurídico añadido exitosamente" });
  } catch (error) {
    res.status(500).send({ code: 0, message: error.message });
  } finally {
    if (connection) {
      connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
  }
};




const updateDestinatario = async (req, res) => {
  let connection;
  try {
      const { id } = req.params;
      const { dni, ruc, nombres, apellidos, telefono, razon_social, direccion, ubicacion, email } = req.body;

      connection = await getConnection();
      const [rows] = await connection.query("SELECT * FROM destinatario WHERE id_destinatario = ?", [id]);
      if (rows.length === 0) {
          return res.status(404).json({ message: "Destinatario no encontrado" });
      }

      const [result] = await connection.query(
          `UPDATE destinatario
          SET dni = ?, ruc = ?, nombres = ?, apellidos = ?, telefono = ?, razon_social = ?, direccion = ?, ubicacion = ?, email = ?
          WHERE id_destinatario = ?`,
          [dni, ruc, nombres, apellidos, telefono, razon_social, direccion, ubicacion, email, id]
      );

      if (result.affectedRows === 0) {
          return res.status(400).json({ message: "No se realizó ninguna actualización" });
      }
      res.json({ message: "Destinatario actualizado con éxito" });
  } catch (error) {
      res.status(500).json({ message: "Error interno del servidor", error: error.message });
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
  (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
  OR
  (razon_social IS NOT NULL AND razon_social <> '')
ORDER BY 
  (CASE 
      WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
      ELSE 1 
   END),
  destinatario;
          `);
          const dataTransformada = result;
          console.log("Datos después de la transformación:", dataTransformada);
      res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
      res.status(500);
      res.send(error.message);
  }  finally {
      if (connection) {
          connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
      }
  }
};

const getDestinatario = async (req, res) => {
  let connection;
  try {
      const { id } = req.params;
      console.log("ID recibido en backend:", id);

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
              id_destinatario = ?
          ORDER BY 
              (CASE 
                  WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
                  ELSE 1 
              END),
              destinatario;`,
          [id]
      );

      if (result.length === 0) {
          return res.status(404).json({ data: [], message: "Destinatario no encontrado" });
      }

      res.json({ code: 1, data: result, message: "Destinatario encontrado" });
  } catch (error) {
      console.error("Error en getDestinatario:", error);
      if (!res.headersSent) {
          res.status(500).json({ message: "Error interno del servidor", error: error.message });
      }
  } finally {
      if (connection) connection.release();
  }
};

const deleteDestinatario = async (req, res) => {
  let connection;
  try {
      const { id } = req.params;
      console.log("ID recibido en backend para eliminación:", id);

      connection = await getConnection();
      const [result] = await connection.query("DELETE FROM destinatario WHERE id_destinatario = ?", [id]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ code: 0, message: "Destinatario no encontrado" });
      }

      res.json({ code: 1, message: "Destinatario eliminado" });
  } catch (error) {
      if (!res.headersSent) {
          res.status(500).send(error.message);
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
  updateDestinatario,
  getDestinatarios,
  getDestinatario

};

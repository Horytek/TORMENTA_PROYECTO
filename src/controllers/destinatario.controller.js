import { getConnection } from "../database/database";

const insertDestinatario = async (req, res) => {
  const {
    ruc, dni, nombres, apellidos, razon_social, ubicacion, telefono, correo
  } = req.body;

  console.log("Datos recibidos:", req.body);
  console.log("Datos recibidos:", {
    ruc, dni, nombres, apellidos, razon_social, ubicacion, telefono, correo
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
    const connection = await getConnection();

    const [result] = await connection.query(
      "INSERT INTO destinatario (ruc, dni, nombres, apellidos, razon_social, direccion, email, telefono) VALUES (?, ?, ?, ?, ?, ?,?,?)",
      [ruc, dni, nombres, apellidos, razon_social, ubicacion, correo, telefono]
    );

    res.json({ code: 1, message: 'Destinatario insertado correctamente', id: result.insertId });
  } catch (error) {
    console.error("Error en el backend:", error.message);
    res.status(500).send({ code: 0, message: error.message });
  }
};

export const methods = {
  insertDestinatario
};

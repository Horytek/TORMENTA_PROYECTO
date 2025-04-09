import { getConnection } from "../database/database";

const getModulos = async (req, res) => {
  try {
    const connection = await getConnection();
    const result = await connection.query(
      "SELECT id_modulo AS id, nombre_modulo AS nombre, ruta FROM modulo ORDER BY id_modulo"
    );
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getSubmodulos = async (req, res) => {
  try {
    const connection = await getConnection();
    const result = await connection.query(
      "SELECT id_submodulo, id_modulo, nombre_sub, ruta FROM submodulos ORDER BY id_submodulo"
    );
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getModulosConSubmodulos = async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [modulos] = await connection.query(
      "SELECT id_modulo AS id, nombre_modulo AS nombre, ruta FROM modulo ORDER BY id_modulo"
    );
    
    const [submodulos] = await connection.query(
      "SELECT id_submodulo, id_modulo, nombre_sub, ruta FROM submodulos ORDER BY id_submodulo"
    );
    
    const decodeBuffer = (field) => {
      return field && typeof field === "object" && field.toString ? field.toString('utf-8') : field;
    };
    
    const modulosConSubmodulos = modulos.map(mod => ({
      id: mod.id,
      nombre: decodeBuffer(mod.nombre),
      ruta: decodeBuffer(mod.ruta),
      submodulos: submodulos
        .filter(sub => sub.id_modulo === mod.id)
        .map(sub => ({
          id_submodulo: sub.id_submodulo,
          id_modulo: sub.id_modulo,
          nombre_sub: decodeBuffer(sub.nombre_sub),
          ruta: decodeBuffer(sub.ruta)
        }))
    }));
    
    res.json(modulosConSubmodulos);
  } catch (error) {
    console.error("Error al obtener módulos y submódulos:", error.message);
    res.status(500).send(error.message);
  }
};

export const methods = {
  getModulos,
  getSubmodulos,
  getModulosConSubmodulos
};


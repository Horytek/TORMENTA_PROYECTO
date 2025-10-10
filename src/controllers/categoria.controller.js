import { getConnection } from "./../database/database.js";

// Cache compartido (mismo que marcas)
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

const getCategorias = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(`
      SELECT id_categoria, nom_categoria, estado_categoria
      FROM categoria
      WHERE id_tenant = ?
      ORDER BY nom_categoria ASC
      LIMIT 200
    `, [req.id_tenant]);
    res.json({ code: 1, data: result, message: "Categorías listadas" });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const getCategoria = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const [result] = await connection.query(`
      SELECT id_categoria, nom_categoria, estado_categoria
      FROM categoria WHERE id_categoria = ? AND id_tenant = ?
      LIMIT 1
    `, [id, req.id_tenant]);

    if (result.length === 0) {
      return res.status(404).json({ code: 0, data: [], message: "Recurso no disponible" });
    }

    res.json({ code: 1, data: result[0], message: "Categoría encontrada" });
  } catch (error) {
    console.error('Error en getCategoria:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const addCategoria = async (req, res) => {
  let connection;
  try {
    const { nom_categoria, estado_categoria } = req.body;

    if (!nom_categoria || typeof nom_categoria !== 'string' || typeof estado_categoria !== 'number') {
      return res.status(400).json({ code: 0, message: "Campos inválidos" });
    }

    const categoria = { nom_categoria: nom_categoria.trim(), estado_categoria, id_tenant: req.id_tenant };
    connection = await getConnection();
    await connection.query("INSERT INTO categoria SET ?", [categoria]);

    const [result] = await connection.query("SELECT LAST_INSERT_ID() AS id");
    
    // Limpiar caché
    queryCache.clear();
    
    res.status(201).json({ code: 1, message: "Categoría añadida con éxito", id: result[0].id });
  } catch (error) {
    console.error('Error en addCategoria:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const updateCategoria = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { nom_categoria, estado_categoria } = req.body;

    connection = await getConnection();
    const [result] = await connection.query(`
      UPDATE categoria 
      SET nom_categoria = ?, estado_categoria = ?
      WHERE id_categoria = ? AND id_tenant = ?
    `, [nom_categoria, estado_categoria, id, req.id_tenant]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 0, message: "Recurso no disponible" });
    }

    // Limpiar caché
    queryCache.clear();

    res.json({ code: 1, message: "Categoría actualizada con éxito" });
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const deactivateCategoria = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const [result] = await connection.query(`
      UPDATE categoria SET estado_categoria = 0 WHERE id_categoria = ? AND id_tenant = ?
    `, [id, req.id_tenant]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 0, message: "Recurso no disponible" });
    }

    // Limpiar caché
    queryCache.clear();

    res.json({ code: 1, message: "Categoría desactivada con éxito" });
  } catch (error) {
    console.error('Error en deactivateCategoria:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

const deleteCategoria = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const [result] = await connection.query("DELETE FROM categoria WHERE id_categoria = ? AND id_tenant = ?", [id, req.id_tenant]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 0, message: "Recurso no disponible" });
    }

    // Limpiar caché
    queryCache.clear();

    res.json({ code: 1, message: "Categoría eliminada" });
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    if (!res.headersSent) res.status(500).json({ code: 0, message: "Ocurrió un error inesperado" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getCategorias,
  getCategoria,
  addCategoria,
  updateCategoria,
  deactivateCategoria,
  deleteCategoria,
};

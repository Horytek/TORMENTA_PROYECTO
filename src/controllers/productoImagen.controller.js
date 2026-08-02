import { getConnection } from "./../database/database.js";
import { uploadImage as subirAImageKit, deleteImage as borrarDeImageKit } from "../services/imagekit.service.js";
import * as repo from "../services/producto/productoImagenRepository.js";

/**
 * Galería de imágenes de producto (ImageKit). Reusa `imagekit.service.js`
 * tal cual (ya usado por el logo de la empresa) — nada nuevo que configurar.
 */

const EXTENSIONES_VALIDAS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

const validarProductoDelTenant = async (connection, { id_tenant, id_producto }) => {
  const [[fila]] = await connection.query(
    `SELECT 1 FROM producto WHERE id_producto = ? AND id_tenant = ? LIMIT 1`,
    [id_producto, id_tenant]
  );
  return Boolean(fila);
};

const listImages = async (req, res) => {
  const id_producto = Number(req.params.id);
  let connection;
  try {
    connection = await getConnection();
    const imagenes = await repo.listarPorProducto(connection, { id_tenant: req.id_tenant, id_producto });
    res.json({ success: true, data: imagenes });
  } catch (error) {
    console.error("Error en listImages:", error);
    res.status(500).json({ success: false, message: "Error al listar las imágenes del producto" });
  } finally {
    if (connection) connection.release();
  }
};

const listAllTenantImages = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const imagenes = await repo.listarTodasDelTenant(connection, { id_tenant: req.id_tenant });
    res.json({ success: true, data: imagenes });
  } catch (error) {
    console.error("Error en listAllTenantImages:", error);
    res.status(500).json({ success: false, message: "Error al listar las imágenes de los productos" });
  } finally {
    if (connection) connection.release();
  }
};

const uploadImage = async (req, res) => {
  const id_producto = Number(req.params.id);
  const { file, fileName } = req.body;
  const id_tenant = req.id_tenant;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension || !EXTENSIONES_VALIDAS.has(extension)) {
    return res.status(400).json({
      success: false,
      message: `Tipo de archivo no permitido. Usa: ${[...EXTENSIONES_VALIDAS].join(", ")}`,
    });
  }

  let connection;
  try {
    connection = await getConnection();

    if (!(await validarProductoDelTenant(connection, { id_tenant, id_producto }))) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    // La subida a ImageKit va SIN conexión tomada — no hay motivo para
    // sostener una conexión del pool mientras se espera a un servicio externo.
    const subida = await subirAImageKit({
      file,
      fileName: `producto_${id_producto}_${Date.now()}.${extension}`,
      folder: "/productos/",
    });

    await connection.beginTransaction();
    try {
      const totalPrevio = await repo.contarImagenes(connection, { id_tenant, id_producto });
      const idImagen = await repo.insertarImagen(connection, {
        id_tenant, id_producto, url: subida.url, file_id: subida.fileId, orden: totalPrevio,
      });

      let urlPrincipal = subida.url;
      if (totalPrevio === 0) {
        urlPrincipal = await repo.marcarPrincipal(connection, { id_tenant, id_producto, id_imagen: idImagen });
      }
      await repo.sincronizarImagenUrlProducto(connection, { id_tenant, id_producto, url: urlPrincipal });

      await connection.commit();
      res.json({
        success: true,
        data: { id_imagen: idImagen, url: subida.url, es_principal: totalPrevio === 0, orden: totalPrevio },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error en uploadImage (producto):", error);
    res.status(500).json({ success: false, message: error.message || "Error al subir la imagen" });
  } finally {
    if (connection) connection.release();
  }
};

const deleteImage = async (req, res) => {
  const id_producto = Number(req.params.id);
  const id_imagen = Number(req.params.idImagen);
  const id_tenant = req.id_tenant;

  let connection;
  let fileIdABorrar = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    try {
      const borrada = await repo.eliminarImagen(connection, { id_tenant, id_producto, id_imagen });
      if (!borrada) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Imagen no encontrada" });
      }
      fileIdABorrar = borrada.file_id;

      if (borrada.es_principal) {
        const siguiente = await repo.obtenerSiguientePrincipal(connection, { id_tenant, id_producto });
        if (siguiente) {
          const url = await repo.marcarPrincipal(connection, { id_tenant, id_producto, id_imagen: siguiente.id_imagen });
          await repo.sincronizarImagenUrlProducto(connection, { id_tenant, id_producto, url });
        } else {
          await repo.sincronizarImagenUrlProducto(connection, { id_tenant, id_producto, url: null });
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error en deleteImage (producto):", error);
    res.status(500).json({ success: false, message: "Error al eliminar la imagen" });
  } finally {
    if (connection) connection.release();
  }

  // Best-effort, fuera de la transacción: un archivo huérfano en ImageKit es
  // inofensivo; ya no hay nada que revertir en la BD a esta altura.
  if (fileIdABorrar) {
    try {
      await borrarDeImageKit(fileIdABorrar);
    } catch (error) {
      console.error("No se pudo borrar el archivo en ImageKit:", error.message);
    }
  }
};

const reorderImages = async (req, res) => {
  const id_producto = Number(req.params.id);
  const { orden } = req.body;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    try {
      await repo.reordenar(connection, { id_tenant, id_producto, orden });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error en reorderImages:", error);
    res.status(400).json({ success: false, message: error.message || "Error al reordenar las imágenes" });
  } finally {
    if (connection) connection.release();
  }
};

const setPrincipal = async (req, res) => {
  const id_producto = Number(req.params.id);
  const id_imagen = Number(req.params.idImagen);
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    try {
      const url = await repo.marcarPrincipal(connection, { id_tenant, id_producto, id_imagen });
      if (!url) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Imagen no encontrada" });
      }
      await repo.sincronizarImagenUrlProducto(connection, { id_tenant, id_producto, url });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error en setPrincipal:", error);
    res.status(500).json({ success: false, message: "Error al marcar la imagen como principal" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { listImages, listAllTenantImages, uploadImage, deleteImage, reorderImages, setPrincipal };
export default methods;

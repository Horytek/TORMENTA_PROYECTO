import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  listTerminos,
  createTermino,
  ensureTermino,
  updateTermino,
  deleteTermino,
} from "../services/ecommerce/TaxonomyService.js";

function fail(res, error, fallback = "Error.") {
  const status = error.status || 500;
  if (status >= 500) console.error("[taxonomia]", error);
  return res.status(status).json({ success: false, message: error.message || fallback });
}

export const adminListTaxonomia = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await listTerminos(connection, req.id_tienda, req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminCreateTaxonomia = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = req.body?.ensure
      ? await ensureTermino(connection, req.id_tienda, req.body)
      : await createTermino(connection, req.id_tienda, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateTaxonomia = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await updateTermino(connection, req.id_tienda, Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminDeleteTaxonomia = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await deleteTermino(connection, req.id_tienda, Number(req.params.id));
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

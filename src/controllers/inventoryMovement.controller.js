import {
  crearTransferenciaGuiada,
  despacharTransferenciaGuiada,
  recibirTransferenciaGuiada,
  cancelarTransferenciaGuiada,
  listarTransferenciasGuiadas,
  crearInventarioFisico,
  registrarConteoCiego,
  reconciliarYAplicarAjuste,
  obtenerMatrizReconciliacion,
  listarInventariosFisicos,
} from "../services/inventario/inventoryMovement.service.js";

/**
 * Controller HTTP para Transferencias Guiadas e Inventario Físico Ciego.
 */

// ────────────────────────── Transferencias Guiadas ──────────────────────────

export const getTransfers = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const { id_almacen, estado } = req.query;
    const data = await listarTransferenciasGuiadas({ id_tenant, id_almacen, estado });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error en getTransfers:", error);
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor" });
  }
};

export const createTransferRequest = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario_solicita = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const { id_almacen_origen, id_almacen_destino, glosa, observaciones, items } = req.body;

    const data = await crearTransferenciaGuiada({
      id_tenant,
      id_almacen_origen,
      id_almacen_destino,
      glosa,
      id_usuario_solicita,
      observaciones,
      items,
    });

    res.json({ success: true, message: "Solicitud de transferencia creada exitosamente", data });
  } catch (error) {
    console.error("Error en createTransferRequest:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const dispatchTransfer = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario_despacha = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const id_transferencia = req.params.id;
    const { items } = req.body;

    const data = await despacharTransferenciaGuiada({
      id_tenant,
      id_transferencia,
      id_usuario_despacha,
      items,
    });

    res.json({ success: true, message: "Transferencia despachada exitosamente", data });
  } catch (error) {
    console.error("Error en dispatchTransfer:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const receiveTransfer = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario_recibe = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const id_transferencia = req.params.id;
    const { items } = req.body;

    const data = await recibirTransferenciaGuiada({
      id_tenant,
      id_transferencia,
      id_usuario_recibe,
      items,
    });

    res.json({ success: true, message: "Transferencia recibida exitosamente", data });
  } catch (error) {
    console.error("Error en receiveTransfer:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelTransfer = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const id_transferencia = req.params.id;

    const data = await cancelarTransferenciaGuiada({ id_tenant, id_transferencia, id_usuario });
    res.json({ success: true, message: "Transferencia cancelada exitosamente", data });
  } catch (error) {
    console.error("Error en cancelTransfer:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ────────────────────────── Inventario Físico Ciego ──────────────────────────

export const getBlindCounts = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const { id_almacen } = req.query;
    const data = await listarInventariosFisicos({ id_tenant, id_almacen });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error en getBlindCounts:", error);
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor" });
  }
};

export const createBlindCount = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario_crea = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const { id_almacen, titulo, observaciones } = req.body;

    const data = await crearInventarioFisico({
      id_tenant,
      id_almacen,
      titulo,
      id_usuario_crea,
      observaciones,
    });

    res.json({ success: true, message: "Sesión de conteo ciego creada exitosamente", data });
  } catch (error) {
    console.error("Error en createBlindCount:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const saveBlindCountItems = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_inventario_fisico = req.params.id;
    const { conteos } = req.body;

    const data = await registrarConteoCiego({
      id_tenant,
      id_inventario_fisico,
      conteos,
    });

    res.json({ success: true, message: "Conteo ciego registrado exitosamente", data });
  } catch (error) {
    console.error("Error en saveBlindCountItems:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReconciliationMatrix = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_inventario_fisico = req.params.id;

    const data = await obtenerMatrizReconciliacion({ id_tenant, id_inventario_fisico });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error en getReconciliationMatrix:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const applyAdjustment = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;
    const id_usuario_aplica = req.user?.id || req.user?.id_usuario || req.id_usuario;
    const id_inventario_fisico = req.params.id;

    const data = await reconciliarYAplicarAjuste({
      id_tenant,
      id_inventario_fisico,
      id_usuario_aplica,
    });

    res.json({ success: true, message: "Ajuste de inventario aplicado exitosamente en 1 clic", data });
  } catch (error) {
    console.error("Error en applyAdjustment:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export default {
  getTransfers,
  createTransferRequest,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  getBlindCounts,
  createBlindCount,
  saveBlindCountItems,
  getReconciliationMatrix,
  applyAdjustment,
};

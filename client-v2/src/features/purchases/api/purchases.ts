import { isAxiosError } from "axios";
import api from "@/api/axios";
import { isOk, unwrapList, unwrapOne } from "@/api/http";
import type {
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderInsertPayload,
  PurchaseInvoice,
  PurchaseInvoiceInsertPayload,
  AccountPayable,
  AccountPayablePayment,
  RegisterPaymentPayload,
  SupplierAdvance,
  SupplierAdvanceInsertPayload,
  ApplyAdvancePayload,
} from "../types";

interface MutationResult {
  success: boolean;
  message?: string;
}

const extractErrorMessage = (err: unknown): string | undefined =>
  isAxiosError(err) ? err.response?.data?.message : undefined;

// ─────────────────────────────────────────────────────────────────
// Órdenes de compra
// ─────────────────────────────────────────────────────────────────

export const getPurchaseOrders = async (filtros: { estado?: string; id_destinatario?: number | string } = {}): Promise<PurchaseOrder[]> =>
  unwrapList<PurchaseOrder>(await api.get("/compras/ordenes", { params: filtros }));

export const getPurchaseOrder = async (id: number): Promise<PurchaseOrderDetail | null> =>
  unwrapOne<PurchaseOrderDetail>(await api.get(`/compras/ordenes/${id}`));

export interface PriceComparisonRow {
  id_destinatario: number;
  proveedor: string;
  ultimo_precio: number;
  fecha_ultimo: string;
  precio_min: number;
  precio_prom: number;
  n: number;
}

export const getPriceComparison = async (id_producto: number): Promise<PriceComparisonRow[]> =>
  unwrapList<PriceComparisonRow>(await api.get("/compras/ordenes/comparacion-precios", { params: { id_producto } }));

export const createPurchaseOrder = async (data: PurchaseOrderInsertPayload): Promise<MutationResult> => {
  try {
    const res = await api.post("/compras/ordenes", data);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const approvePurchaseOrder = async (id: number): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/ordenes/${id}/aprobar`);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const receivePurchaseOrder = async (
  id: number,
  items?: { id_detalle_orden_compra: number; cantidad: number }[]
): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/ordenes/${id}/recibir`, items ? { items } : undefined);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const cancelPurchaseOrder = async (id: number): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/ordenes/${id}/cancelar`);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

// ─────────────────────────────────────────────────────────────────
// Facturas de compra
// ─────────────────────────────────────────────────────────────────

export const getPurchaseInvoices = async (filtros: { estado?: string } = {}): Promise<PurchaseInvoice[]> =>
  unwrapList<PurchaseInvoice>(await api.get("/compras/facturas", { params: filtros }));

export const createPurchaseInvoice = async (data: PurchaseInvoiceInsertPayload): Promise<MutationResult> => {
  try {
    const res = await api.post("/compras/facturas", data);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

// ─────────────────────────────────────────────────────────────────
// Cuentas por pagar
// ─────────────────────────────────────────────────────────────────

export const getAccountsPayable = async (filtros: { estado?: string; id_destinatario?: number | string } = {}): Promise<AccountPayable[]> =>
  unwrapList<AccountPayable>(await api.get("/compras/cuentas-por-pagar", { params: filtros }));

export const getAccountPayablePayments = async (id: number): Promise<AccountPayablePayment[]> =>
  unwrapList<AccountPayablePayment>(await api.get(`/compras/cuentas-por-pagar/${id}/pagos`));

export const registerAccountPayablePayment = async (id: number, data: RegisterPaymentPayload): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/cuentas-por-pagar/${id}/pagos`, data);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

// ─────────────────────────────────────────────────────────────────
// Anticipos a proveedor
// ─────────────────────────────────────────────────────────────────

export const getSupplierAdvances = async (filtros: { estado?: string; id_destinatario?: number | string } = {}): Promise<SupplierAdvance[]> =>
  unwrapList<SupplierAdvance>(await api.get("/compras/anticipos", { params: filtros }));

export const createSupplierAdvance = async (data: SupplierAdvanceInsertPayload): Promise<MutationResult> => {
  try {
    const res = await api.post("/compras/anticipos", data);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

export const applySupplierAdvance = async (id: number, data: ApplyAdvancePayload): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/anticipos/${id}/aplicar`, data);
    return { success: isOk(res), message: res.data?.message };
  } catch (err) {
    return { success: false, message: extractErrorMessage(err) };
  }
};

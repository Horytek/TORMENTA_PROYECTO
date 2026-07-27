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

export const receivePurchaseOrder = async (id: number): Promise<MutationResult> => {
  try {
    const res = await api.post(`/compras/ordenes/${id}/recibir`);
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

export const getAccountsPayable = async (filtros: { estado?: string } = {}): Promise<AccountPayable[]> =>
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

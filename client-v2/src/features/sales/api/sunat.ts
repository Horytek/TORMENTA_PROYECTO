import api from "@/api/axios";

// ─────────────────────────────────────────────────────────────────
// SUNAT / CPE — Emisión de Comprobantes Electrónicos
// ─────────────────────────────────────────────────────────────────

export interface SunatConfig {
  ruc: string;
  razon_social: string;
  sol_user: string;
  sol_pass: string;
  certificado_path: string;
  clave_certificado: string;
  ambiente: "demo" | "produccion";
}

export interface EmisionResult {
  success: boolean;
  estado_sunat: string;
  codigo_hash?: string;
  numero_comprobante?: string;
  xml_path?: string;
  pdf_path?: string;
  message?: string;
  CDR?: string;
  ticket?: string;
}

// ── Obtener configuración SUNAT ────────────────────────────────
export const getSunatConfig = async (): Promise<SunatConfig> => {
  const response = await api.get("/sunat/config");
  const data = response.data;
  return data?.data || data;
};

// ── Emitir CPE (build + sign + send) ───────────────────────────
// POST /sunat/cpe/invoice/emit
// Body: comprobante (venta completa)
export const emitComprobante = async (comprobante: Record<string, unknown>): Promise<EmisionResult> => {
  const response = await api.post("/sunat/cpe/invoice/emit", comprobante);
  const data = response.data;
  return {
    success: data?.code === 1 || data?.success === true,
    estado_sunat: data?.estado_sunat || "pending",
    codigo_hash: data?.codigo_hash,
    numero_comprobante: data?.numero_comprobante,
    xml_path: data?.xml_path,
    pdf_path: data?.pdf_path,
    message: data?.message,
    CDR: data?.CDR,
    ticket: data?.ticket,
  };
};

// ── Solo generar PDF del comprobante ────────────────────────────
// POST /sunat/cpe/invoice/pdf
export const generateInvoicePdf = async (comprobante: Record<string, unknown>): Promise<string> => {
  const response = await api.post("/sunat/cpe/invoice/pdf", comprobante, {
    responseType: "blob",
  });
  const data = response.data;
  return data?.pdf_path || URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
};

// ── Consultar estado por ticket (para summary/voided) ───────────
// GET /sunat/cpe/status/:ticket
export const getSunatStatus = async (ticket: string): Promise<EmisionResult> => {
  const response = await api.get(`/sunat/cpe/status/${ticket}`);
  const data = response.data;
  return {
    success: data?.code === 1 || data?.success === true,
    estado_sunat: data?.estado_sunat || "unknown",
    codigo_hash: data?.codigo_hash,
    message: data?.message,
    CDR: data?.CDR,
    ticket: data?.ticket,
  };
};

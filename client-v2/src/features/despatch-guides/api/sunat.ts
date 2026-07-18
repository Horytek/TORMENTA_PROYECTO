import api from "@/api/axios";
import type { EmpresaSunatData, GuideFormItem } from "../types";

/**
 * NOTA: este módulo emite guías de remisión electrónicas REALES ante SUNAT
 * (POST /sunat/gre/despatch/emit, firma XML + envío). No es un simulacro.
 * Cualquier cambio aquí debe conservar el mismo contrato de payload que ya
 * consume `emitGre` en el backend (src/controllers/sunat.controller.js).
 */

export interface EmitirGuiaSunatInput {
  numComprobante: string;
  /** Fecha (YYYY-MM-DD) y hora (HH:MM:SS) de generación de la guía. */
  fechaGeneracion: string;
  horaGeneracion: string;
  glosa: string;
  empresa: EmpresaSunatData;
  destinatario: { documento: string; nombre: string };
  ubigeoOrigen: { ubigeo: string; direccion: string };
  ubigeoDestino: { ubigeo: string; direccion: string };
  transportista: { documento?: string | null; nombre?: string | null; placa?: string | null };
  peso?: string | number | null;
  items: GuideFormItem[];
}

/** "T400-00000001" -> { serie: "T400", correlativo: "00000001" } */
function parseNumComprobante(num: string): { serie: string; correlativo: string } {
  const match = /^([A-Za-z0-9]+)-(\d+)$/.exec(num.trim());
  if (!match) return { serie: num, correlativo: "1" };
  return { serie: match[1], correlativo: match[2] };
}

/** Combina fecha + hora locales (UTC-5) al formato ISO con offset que espera SUNAT. */
function buildFechaEmisionIso(fecha: string, hora: string): string {
  return `${fecha}T${hora}-05:00`;
}

export async function emitirGuiaSunat(input: EmitirGuiaSunatInput): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const { serie, correlativo } = parseNumComprobante(input.numComprobante);

  const payload = {
    version: 2022,
    tipoDoc: "05",
    serie,
    correlativo,
    fechaEmision: buildFechaEmisionIso(input.fechaGeneracion, input.horaGeneracion),
    company: {
      ruc: input.empresa.ruc,
      razonSocial: input.empresa.razonSocial,
      nombreComercial: input.empresa.nombreComercial || input.empresa.razonSocial,
      address: {
        direccion: input.empresa.direccion,
        provincia: input.empresa.provincia,
        departamento: input.empresa.departamento,
        distrito: input.empresa.distrito,
        ubigueo: input.empresa.ubigueo,
      },
    },
    destinatario: {
      numDoc: input.destinatario.documento,
      rznSocial: input.destinatario.nombre,
    },
    observacion: input.glosa || "",
    envio: {
      fecTraslado: buildFechaEmisionIso(input.fechaGeneracion, input.horaGeneracion),
      pesoTotal: input.peso || 0,
      undPesoTotal: "KGM",
      llegada: { ubigueo: input.ubigeoDestino.ubigeo, direccion: input.ubigeoDestino.direccion },
      partida: { ubigueo: input.ubigeoOrigen.ubigeo, direccion: input.ubigeoOrigen.direccion },
      transportista: {
        numDoc: input.transportista.documento || "",
        rznSocial: input.transportista.nombre || "",
        placa: input.transportista.placa || "",
      },
    },
    details: input.items.map((item) => ({
      cantidad: item.cantidad,
      unidad: "KGM",
      descripcion: item.descripcion,
      codigo: item.codigo,
    })),
  };

  try {
    const res = await api.post("/sunat/gre/despatch/emit", payload);
    return { success: res.status === 200 && res.data?.ok !== false, data: res.data };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "Error al enviar a SUNAT" };
  }
}

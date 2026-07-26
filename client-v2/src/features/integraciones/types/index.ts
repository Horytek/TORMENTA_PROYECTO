/** Contrato con `GET /api/integraciones` (src/services/integraciones/). */

export type EstadoIntegracion = "OPERATIVO" | "DEGRADADO" | "NO_CONFIGURADO" | "NO_DISPONIBLE";

/** Estados de una credencial guardada (diagnosticoCredenciales.js). */
export type EstadoCredencial =
  | "OK"
  | "FALTA"
  | "VACIA"
  | "FORMATO_ANTIGUO"
  | "ILEGIBLE"
  | "ENMASCARADA";

/** Estados del certificado digital .p12 (diagnosticoCertificado.js). */
export type EstadoCertificado =
  | "VIGENTE"
  | "POR_VENCER"
  | "VENCIDO"
  | "AUN_NO_VIGENTE"
  | "CLAVE_INCORRECTA"
  | "ILEGIBLE"
  | "FALTA";

export interface DetalleCredencial {
  clave: string;
  etiqueta: string;
  requerido: boolean;
  estado: EstadoCredencial;
  mensaje: string;
}

export interface DiagnosticoCertificado {
  estado: EstadoCertificado;
  mensaje: string;
  titular: string | null;
  vigenteHasta: string | null;
  diasRestantes: number | null;
}

export interface Integracion {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoIntegracion;
  mensaje: string;
  detalles: DetalleCredencial[];
  /** Solo SUNAT. */
  entorno?: "beta" | "produccion" | null;
  ubigeoConfigurado?: boolean;
  certificado?: DiagnosticoCertificado;
  accion?: { texto: string; ruta: string };
}

export interface EstadoIntegraciones {
  generadoEn: string;
  resumen: {
    total: number;
    operativas: number;
    conProblema: number;
    requierenAccion: string[];
  };
  integraciones: Integracion[];
}

/** Datos del negocio (GET /negocio). Corresponde a la tabla empresa del tenant. */
export interface Negocio {
  nombre_negocio?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  codigoPostal?: string;
  moneda?: string;
  pais?: string;
  logotipo_url?: string;  // backend returns logotipo_url (maps from empresa.logotipo)
  igv_incluido?: boolean; // true=precio incluye IGV, false=precio sin IGV
  dashboard_widgets?: string[] | null; // secciones visibles del dashboard; null = todas
}

/** Claves válidas de widget, deben coincidir con DASHBOARD_WIDGETS en negocio.controller.js */
export const DASHBOARD_WIDGET_OPTIONS = [
  { key: "kpis", label: "Indicadores (ventas, clientes, productos, utilidad)" },
  { key: "grafico", label: "Gráfico de ventas" },
  { key: "transacciones", label: "Transacciones recientes" },
  { key: "accionesRapidas", label: "Acciones rápidas" },
  { key: "stockBajo", label: "Stock bajo" },
  { key: "desempeno", label: "Desempeño por sucursal" },
] as const;

export type NegocioInput = Partial<Negocio>;

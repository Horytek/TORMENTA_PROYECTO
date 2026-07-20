/** Metadata visual/dinámica compartida por módulo y submódulo (sidebar). */
export interface CatalogMeta {
  icon?: string | null;
  group_name?: string | null;
  sort_order?: number;
  frontend_route?: string | null;
  is_visible?: boolean;
  /** Acciones habilitadas del módulo: null = todas las estándar; array = solo
   *  esas (estándar + custom del catálogo). Al leer de BD puede venir como
   *  string JSON; al enviar se manda array o null. */
  active_actions?: string[] | string | null;
}

/** Módulo de navegación (tabla `modulo`) — define la estructura de menú del ERP. */
export interface Modulo extends CatalogMeta {
  id_modulo: number;
  nombre_modulo: string;
  ruta: string;
}

/** Submódulo (tabla `submodulo`), hijo de un módulo. */
export interface Submodulo extends CatalogMeta {
  id_submodulo: number;
  id_modulo: number;
  nombre_sub: string;
  ruta_submodulo: string;
}

export interface ModuloInput extends CatalogMeta {
  nombre: string;
  ruta: string;
}

/** Payload de `PUT /modulos/:id` — este endpoint espera `nombre_modulo`, no `nombre` (ver ModuloInput). */
export interface ModuloUpdateInput extends CatalogMeta {
  nombre_modulo: string;
  ruta: string;
}

export interface SubmoduloInput extends CatalogMeta {
  id_modulo: number;
  nombre_sub: string;
  ruta: string;
}

/** Usuario administrador (id_rol=1) a nivel plataforma, con su empresa y plan. */
export interface PlatformUser {
  id_usuario: number;
  usua: string;
  id_rol: number;
  id_empresa: number | null;
  plan_pago: string;
  estado_usuario_1: number;
  fecha_pago: string | null;
}

export interface Empresa {
  id_empresa: number;
  razonSocial: string;
}

/** Empresa completa (tabla `empresa`) para el directorio SUNAT del panel Developer. */
export interface EmpresaSunat {
  id_empresa: number;
  ruc?: string | null;
  razonSocial: string;
  nombreComercial?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  email?: string | null;
  logotipo?: string | null;
  pais?: string | null;
  /** Códigos ISO separados por coma, ej. "PEN, USD". */
  moneda?: string | null;
}

export type EmpresaSunatInput = Omit<EmpresaSunat, "id_empresa">;

export interface NewUserInput {
  id_rol: number;
  usua: string;
  contra: string;
  estado_usuario: number;
}

export interface UpdateUserPlanInput {
  id_empresa: number | string;
  plan_pago: number;
  estado_usuario: string;
  fecha_pago: string | null;
}

/** Acción global disponible para permisos (tabla `action_catalog`). */
export interface CatalogAction {
  id_action: number;
  action_key: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface CatalogActionInput {
  action_key: string;
  name: string;
  description?: string;
}

/** Plan de suscripción (tabla `plan_pago`). */
export interface Plan {
  id_plan: number;
  descripcion_plan: string;
}

/** Versión de plantilla de entitlements de un plan (tabla `plan_template_version`). */
export interface PlanTemplateVersion {
  id: number;
  id_plan: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  published_at: string | null;
}

/** Módulos/submódulos incluidos en una versión de plantilla. */
export interface PlanEntitlements {
  modulos: number[];
  submodulos: number[];
}

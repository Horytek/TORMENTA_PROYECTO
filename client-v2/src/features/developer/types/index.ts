/** Módulo de navegación (tabla `modulo`) — define la estructura de menú del ERP. */
export interface Modulo {
  id_modulo: number;
  nombre_modulo: string;
  ruta: string;
}

/** Submódulo (tabla `submodulo`), hijo de un módulo. */
export interface Submodulo {
  id_submodulo: number;
  id_modulo: number;
  nombre_sub: string;
  ruta_submodulo: string;
}

export interface ModuloInput {
  nombre: string;
  ruta: string;
}

export interface SubmoduloInput {
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

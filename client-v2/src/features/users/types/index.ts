/** Usuario tal como lo devuelve el backend (GET /usuario). `contra` (hash) se ignora en el front. */
export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nom_rol?: string;
  usua: string;
  estado_usuario: number; // 1 = activo, 0 = inactivo
  id_empresa?: number | null;
  plan_pago_1?: string | null;
}

/** Rol para el selector (GET /rol). */
export interface Rol {
  id_rol: number;
  nom_rol: string;
}

export interface UsuarioInput {
  id_rol: number;
  usua: string;
  /** Solo se envía al crear o al cambiar la contraseña. El backend la hashea. */
  contra?: string;
  estado_usuario: number;
  id_empresa?: number | null;
}

/** Roles que no deben asignarse desde este panel (owner y developer). */
export { RESERVED_ROLE_IDS as RESERVED_ROLES } from "@/hooks/usePermissions";

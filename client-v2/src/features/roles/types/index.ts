export interface Rol {
  id_rol: number;
  nom_rol: string;
  estado_rol: number; // 1 = activo, 0 = inactivo
}

export interface RolInput {
  nom_rol: string;
  estado_rol: number;
}

/** Roles del sistema que no deben editarse/eliminarse desde el panel. */
export const RESERVED_ROLES = [1, 10];

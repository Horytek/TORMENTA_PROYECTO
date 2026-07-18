/** Payload de POST /api/empresa (ruta pública, usada por el flujo de registro). */
export interface EmpresaRegisterInput {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string | null;
  direccion: string;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  email?: string | null;
  logotipo?: string | null;
  moneda?: string | null;
  pais?: string | null;
  plan_pago: number;
}

/** Payload de POST /api/usuario/landing (ruta pública "sin restricciones de plan"). */
export interface UsuarioLandingInput {
  id_rol: number;
  usua: string;
  contra: string;
  estado_usuario: number;
  id_empresa: number;
  plan_pago: number;
}

export interface RegisterFormValues {
  nombre: string;
  apellido: string;
  ruc: string;
  razonSocial: string;
  direccion: string;
  telefonoEmpresa: string;
  emailEmpresa: string;
  pais: string;
  aceptaTerminos: boolean;
}

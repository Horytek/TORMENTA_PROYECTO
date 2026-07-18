/** Credencial guardada en la tabla `clave` (SUNAT SOL, certificado, GRE). El valor real nunca viaja al frontend. */
export interface Clave {
  id_clave: number;
  id_empresa: number;
  tipo: string;
  /** Siempre "••••••••••••••••" cuando `hasValue` es true — el backend nunca expone el valor real. */
  valor: string;
  hasValue: boolean;
  estado_clave: number;
}

export interface ClaveInput {
  id_empresa: number;
  tipo: string;
  /** Si es el placeholder de bullets, el backend lo interpreta como "sin cambios" y no sobrescribe el valor real. */
  valor: string;
  estado_clave?: number;
}

/** Tipos de clave usados por el formulario de cuenta (deben calzar con lo que ya lee sunat.controller / servicios existentes). */
export type ClaveTipo =
  | "sunat_sol_user"
  | "sunat_sol_pass"
  | "sunat_env"
  | "sunat_cert_p12"
  | "sunat_cert_pass"
  | "sunat_client_id"
  | "sunat_client_secret";

export interface Funcion {
  id_funciones: number;
  funcion: string;
}

export interface PlanFuncionDetalle {
  id_funcion: number;
}

export interface Plan {
  id_plan: number;
  nombre?: string;
  /** Estructura nueva. */
  funciones_detalles?: PlanFuncionDetalle[];
  /** Fallback legado: string de ids separados por coma. */
  funciones?: string;
}

/** Empresa completa (tabla `empresa`), usada para precargar el formulario de cuenta. */
export interface EmpresaAccount {
  id_empresa: number;
  ruc?: string;
  razonSocial?: string;
  nombreComercial?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  codigoPostal?: string;
  email?: string;
  telefono?: string;
  logotipo?: string;
  moneda?: string;
  pais?: string;
  plan_pago?: string;
  fecha_vencimiento?: string;
  costo?: string;
  estado?: string;
  responsables?: { nombre: string; rol: string }[];
}

export interface AccountFormValues {
  ruc: string;
  razon_social: string;
  direccion: string;
  environment: string;
  sol_user: string;
  sol_pass: string;
  cert_password: string;
  certificadoBase64: string;
  logoBase64: string;
  client_id: string;
  client_secret: string;
}

export interface MpPayment {
  id: number | string;
  status: string;
  currency_id?: string;
  transaction_amount?: number;
  date_created?: string;
  created_at?: string;
}

export interface PlanChangeInput {
  current_plan: string;
  target_plan: string;
  reason: string;
  requester_email: string;
  requester_name: string;
}

export interface PreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface PreferenceInput {
  items: PreferenceItem[];
  payer: { email: string; name: string; surname?: string; phone?: { number: string } };
  external_reference: string;
  back_urls: { success: string; failure: string; pending: string };
  auto_return: string;
}

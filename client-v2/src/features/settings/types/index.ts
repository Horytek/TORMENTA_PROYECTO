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
  logotipo?: string;
}

export type NegocioInput = Partial<Negocio>;

export interface Vendedor {
  dni: string;
  id_usuario: number;
  nombre: string;       // CONCAT(nombres, ' ', apellidos) — viene del backend
  nombres: string;
  apellidos: string;
  telefono: string;
  usua?: string;        // nombre de usuario
  estado_vendedor: number; // 1 = activo, 0 = inactivo
}

export interface VendedorInput {
  dni: string;
  id_usuario: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  estado_vendedor?: number;
}

export interface VendedorUpdate extends VendedorInput {
  nuevo_dni?: string;
}

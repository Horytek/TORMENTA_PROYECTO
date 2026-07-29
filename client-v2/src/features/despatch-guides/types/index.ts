/** Detalle (item) de una guía, tal como lo devuelve GET /guia_remision. */
export interface GuideDetail {
  codigo: number;
  marca: string;
  descripcion: string;
  cantidad: number;
  um: string;
  precio?: number;
  /** "-" cuando el producto no tiene esa variante (legado talla/tonalidad). */
  tonalidad?: string | null;
  talla?: string | null;
  sku_label?: string | null;
  /** JSON stringificado de atributos dinámicos, ej. '{"1":"Rojo","2":"M"}'. */
  attributes?: string | null;
}

/**
 * Guía de remisión (cabecera) — GET /guia_remision.
 * `estado`: 1 = activa, 0 = anulada (columna `estado_guia` en BD; convención inversa a nota_almacen).
 */
export interface Guide {
  id: number;
  fecha: string;
  h_generacion?: string;
  f_anulacion?: string | null;
  u_modifica?: string | null;
  num_guia: string;
  cliente: string;
  documento: string;
  vendedor?: string;
  dni?: string;
  serieNum?: string;
  num?: string;
  total?: number | null;
  concepto: string;
  estado: number;
  nombre_sucursal: string;
  dir_partida?: string | null;
  dir_destino?: string | null;
  id_ubigeo_o?: number | null;
  id_ubigeo_d?: number | null;
  observacion?: string | null;
  transportistapriv?: string | null;
  transportistapub?: string | null;
  docpriv?: string | null;
  docpub?: string | null;
  canti?: number | null;
  peso?: number | null;
  detalles?: GuideDetail[];
}

export interface GuideFiltros {
  page?: number;
  limit?: number;
  num_guia?: string;
  documento?: string;
  nombre_sucursal?: string;
  fecha_i?: string;
  fecha_e?: string;
}

/** Sucursal de origen — GET /guia_remision/sucursal. */
export interface GuideSucursal {
  id: number;
  nombre: string;
  direccion: string;
  /** Almacén vinculado a esta sucursal (vía sucursal_almacen); null si no tiene ninguno. */
  id_almacen: number | null;
}

/** Ubigeo (departamento/provincia/distrito) — GET /guia_remision/ubigeo. */
export interface GuideUbigeo {
  id: number;
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

/** Destinatario o cliente unificado — GET /guia_remision/clienteguia. Id puede venir como "C-{id_cliente}". */
export interface GuideDestinatario {
  id: string;
  destinatario: string;
  documento: string;
  ubicacion?: string;
}

export interface GuideDocumento {
  nuevo_numero_de_guia: string;
}

/** Producto disponible para agregar a una guía — GET /guia_remision/productos. */
export interface GuideProducto {
  id_producto: number;
  codigo: number;
  descripcion: string;
  marca: string;
  codbarras?: string;
  stock?: number;
}

export interface TransportistaPublico {
  id: string;
  placa?: string | null;
  ruc: string;
  razonsocial: string;
  telefonopub?: string | null;
  vehiculopub?: string | null;
}

export interface TransportistaPrivado {
  id: string;
  placa?: string | null;
  dni: string;
  transportista: string;
  telefonopriv?: string | null;
  vehiculopriv?: string | null;
}

export interface Vehiculo {
  placa: string;
  tipo: string;
}

/** Item agregado a una guía en edición (estado local del formulario). */
export interface GuideFormItem {
  uniqueKey: string;
  codigo: number;
  descripcion: string;
  marca: string;
  stock?: number;
  cantidad: number;
  id_tonalidad: number | null;
  id_talla: number | null;
  id_sku: number | null;
  nombre_tonalidad: string | null;
  nombre_talla: string | null;
  sku_label: string | null;
}

/** Transporte seleccionado en el formulario (público o privado). */
export interface SelectedTransporte {
  tipo: "publico" | "privado";
  id: string;
  empresa?: string;
  conductor?: string;
  ruc?: string;
  dni?: string;
  placa?: string;
  telefono?: string;
}

/** Payload esperado por POST /guia_remision/nuevaguia. */
export interface GuideInsertPayload {
  id_sucursal: string | number;
  id_ubigeo_o: number;
  id_ubigeo_d: number;
  id_destinatario: string | number;
  id_transportista: string;
  glosa: string;
  dir_partida?: string;
  dir_destino?: string;
  canti?: string | number;
  peso?: string | number;
  observacion?: string;
  f_generacion: string;
  h_generacion: string;
  total?: number;
  producto: number[];
  num_comprobante: string;
  cantidad: number[];
  tonalidad: (number | null)[];
  talla: (number | null)[];
  sku: (number | null)[];
}

export interface GuideInsertResult {
  success: boolean;
  message?: string;
  id_guiaremision?: number;
}

export interface NewDestinatarioNaturalInput {
  dni: string;
  nombres: string;
  apellidos: string;
  ubicacion: string;
}

export interface NewDestinatarioJuridicoInput {
  ruc: string;
  razon_social: string;
  ubicacion: string;
}

export interface NewTransportistaPublicoInput {
  id: string;
  placa?: string;
  ruc: string;
  razon_social: string;
  ubicacion: string;
  telefono?: string;
}

export interface NewTransportistaPrivadoInput {
  id: string;
  placa?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  ubicacion: string;
  telefono?: string;
}

export interface NewVehiculoInput {
  placa: string;
  tipo: string;
}

/** Datos de la empresa (tabla `empresa` completa) usados para armar el XML de SUNAT. */
export interface EmpresaSunatData {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion: string;
  provincia?: string;
  departamento?: string;
  distrito?: string;
  ubigueo?: string;
}

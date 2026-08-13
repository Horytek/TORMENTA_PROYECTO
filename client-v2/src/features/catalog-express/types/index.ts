export interface CatalogoNegocio {
  nombre: string;
  telefono: string | null;
  logo: string | null;
  direccion: string | null;
}

export interface DisponibilidadInfo {
  estado: "disponible" | "ultimas_unidades" | "otra_sucursal" | "agotado" | "consultar";
  label: string;
  stock: number;
}

export interface CatalogoProducto {
  codigo: number;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
  images: string[];
  undm?: string;
  nom_marca: string | null;
  categoria: string | null;
  stock: number;
  slug?: string;
  destacado?: boolean;
  disponibilidad?: DisponibilidadInfo;
  id_subcategoria?: number;
  id_marca?: number;
}

export interface CatalogoVariante {
  id_sku: number;
  sku: string;
  cod_barras?: string;
  precio: number;
  attributes_json: Record<string, string>;
  stock: number;
  disponibilidad?: DisponibilidadInfo;
}

export interface EjeVariante {
  id_atributo: number;
  nombre: string;
  tipo_input: string;
  slug: string | null;
  valores: string[];
}

export interface ProductoDetalle extends CatalogoProducto {
  atributos: { id_atributo: number; nombre: string; valor: string; tipo_input: string; slug: string | null }[];
  ejes_variante: EjeVariante[];
  variantes: CatalogoVariante[];
  stock_por_sucursal: {
    id_sucursal: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    stock: number;
    disponibilidad: DisponibilidadInfo;
  }[];
}

export interface StorefrontInfo {
  id_tenant: number;
  slug: string;
  activo: number;
  nombre: string;
  telefono: string | null;
  logo: string | null;
  banner: string | null;
  direccion: string | null;
  color_primario: string | null;
  color_acento: string | null;
  mensaje_bienvenida: string | null;
  checkout_habilitado: boolean;
  stock_bajo_umbral: number;
  mp_conectado: boolean;
  mp_public_key: string | null;
  mp_modo: string;
}

export interface SucursalPublica {
  id_sucursal: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  id_almacenes: number[];
}

export interface CatalogoPublico {
  negocio: CatalogoNegocio;
  store?: StorefrontInfo;
  sucursales?: SucursalPublica[];
  productos: CatalogoProducto[];
  destacados?: CatalogoProducto[];
  mas_vendidos?: CatalogoProducto[];
  banners?: { id_banner: number; titulo: string; subtitulo: string | null; imagen_url: string | null; link_url: string | null }[];
  facets?: {
    categorias: { nombre: string; count: number }[];
    marcas: { nombre: string; count: number }[];
    atributos: {
      id_atributo: number;
      nombre: string;
      valores: string[];
    }[];
  };
  entrega?: {
    retiro_activo: number;
    delivery_activo: number;
    costo_default: number;
  };
}

export interface CarritoItem {
  producto: CatalogoProducto;
  cantidad: number;
  id_sku?: number | null;
  attrs?: Record<string, string>;
  precio_unitario?: number;
}

export interface Comprador {
  id_comprador: number;
  id_tenant: number;
  email: string;
  nombres: string;
  apellidos: string | null;
  telefono: string | null;
  documento: string | null;
  id_cliente: number | null;
}

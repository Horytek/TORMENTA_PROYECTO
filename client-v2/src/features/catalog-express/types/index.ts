export interface CatalogoNegocio {
  nombre: string;
  telefono: string | null;
  logo: string | null;
  direccion: string | null;
}

export interface CatalogoProducto {
  codigo: number;
  descripcion: string;
  precio: number;
  imagen_url: string | null;
  /** Galería completa (principal primero); vacío si el producto no tiene imágenes cargadas. */
  images: string[];
  undm: string;
  nom_marca: string | null;
  categoria: string | null;
  stock: number;
}

export interface CatalogoPublico {
  negocio: CatalogoNegocio;
  productos: CatalogoProducto[];
}

export interface CarritoItem {
  producto: CatalogoProducto;
  cantidad: number;
}

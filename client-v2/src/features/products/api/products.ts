import api from "@/api/axios";
import type { Product, Brand, Category, Subcategory, UnitOfMeasure, ProductAttribute, ProductVariant } from "../types";

// 1. Productos CRUD
export const getProducts = async (params?: { page?: number; limit?: number; q?: string }): Promise<{ data: Product[]; total: number; totalPages: number }> => {
  const response = await api.get("/productos", { params });
  const data = response.data;
  return {
    data: data?.data || [],
    total: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 1
  };
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/productos/${id}`);
  const data = response.data;
  return Array.isArray(data?.data) ? data.data[0] : (data?.data || data);
};

export const getLastIdProducto = async (): Promise<number> => {
  const response = await api.get("/productos/lastid");
  const data = response.data;
  const list = data?.data || (Array.isArray(data) ? data : []);
  const val = list[0]?.ultimo_id ?? data?.ultimo_id ?? data;
  return Number(val) || 0;
};

export const createProduct = async (product: Omit<Product, "id_producto">): Promise<{ success: boolean; id_producto: number }> => {
  const response = await api.post("/productos", product);
  const data = response.data;
  const isSuccess = data?.code === 1 || data?.success === true;
  return {
    success: isSuccess,
    id_producto: data?.id_producto || data?.id || 0
  };
};

export const updateProduct = async (id: number, product: Omit<Product, "id_producto">): Promise<boolean> => {
  const response = await api.put(`/productos/${id}`, product);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/productos/${id}`);
  const data = response.data;
  return data?.code === 1 || data?.code === 2 || data?.success === true || data === true;
};

// 2. Marcas, Categorías y Subcategorías
export const getBrands = async (): Promise<Brand[]> => {
  const response = await api.get("/marcas");
  const data = response.data;
  const list = data?.data || (Array.isArray(data) ? data : []);
  return list.map((b: any) => ({
    id_marca: Number(b.id_marca),
    nombre: String(b.nom_marca || b.nombre || ''),
    estado: b.estado_marca ?? b.estado
  }));
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/categorias");
  const data = response.data;
  const list = data?.data || (Array.isArray(data) ? data : []);
  return list.map((c: any) => ({
    id_categoria: Number(c.id_categoria),
    nombre: String(c.nom_categoria || c.nombre || ''),
    estado: c.estado_categoria ?? c.estado
  }));
};

export const getSubcategories = async (): Promise<Subcategory[]> => {
  const response = await api.get("/subcategorias");
  const raw = response.data?.data ?? response.data ?? [];

  const list = Array.isArray(raw) ? raw : [];
  return list.map((sub: any) => ({
    id_subcategoria: Number(sub.id_subcategoria),
    id_categoria: Number(sub.id_categoria),
    // Backend usa nom_subcat en la BD, lo normalizamos a nombre_sub para el frontend
    nombre_sub: String(sub.nom_subcat || sub.nombre_sub || sub.nombre || ''),
    nom_categoria: String(sub.nom_categoria || ''),
    estado: sub.estado_subcat ?? sub.estado
  }));
};

// 3. Unidades de medida
export const getUnits = async (): Promise<UnitOfMeasure[]> => {
  const response = await api.get("/unidades");
  const data = response.data;
  const list = data?.data || (Array.isArray(data) ? data : []);
  return list
    .filter((u: any) => u.estado === 1 || u.estado === '1')
    .map((u: any) => ({
      id_unidad: u.id_unidad,
      nombre: u.descripcion || "",
      simbolo: u.codigo_sunat || "",
      estado: Number(u.estado),
    }));
};

// 4. Atributos dinámicos y variantes (reusa endpoints de /attributes, ya expuestos
// para el Gestor de Contenidos, más los específicos de producto).
export const getCategoryAttributes = async (catId: number | string): Promise<ProductAttribute[]> => {
  const response = await api.get(`/attributes/category/${catId}`);
  const data = response.data;
  return data?.data || (Array.isArray(data) ? data : []);
};

export const getAttributeValues = async (attrId: number | string): Promise<{ id_valor: number; valor: string }[]> => {
  const response = await api.get(`/attributes/${attrId}/values`);
  const data = response.data;
  return data?.data || (Array.isArray(data) ? data : []);
};

export const getProductAttributes = async (productId: number): Promise<{ attributes: { id_atributo: number; nombre: string; values: { id: number; valor: string; hex?: string }[] }[] }> => {
  const response = await api.get(`/productos/${productId}/attributes`);
  const data = response.data;
  return data?.data || data;
};

export const getProductVariants = async (productId: number, idAlmacen?: number): Promise<ProductVariant[]> => {
  const response = await api.get(`/productos/${productId}/variants`, { params: idAlmacen ? { id_almacen: idAlmacen } : undefined });
  const data = response.data;
  return data?.data || (Array.isArray(data) ? data : []);
};

export interface HistorialPrecioItem {
  id_log: number;
  fecha: string;
  descripcion: string;
  usuario?: string;
}

export const getHistorialPrecioProducto = async (productId: number): Promise<HistorialPrecioItem[]> => {
  const response = await api.get(`/productos/${productId}/historial-precio`);
  return response.data?.data || [];
};

export const generateSKUs = async (productId: number, data: { id_atributo: number; values: { id: string | number; label: string }[] }[]): Promise<boolean> => {
  const response = await api.post("/productos/skus/generate", {
    id_producto: productId,
    attributes: data
  });
  return response.data?.code === 1;
};

// 5. Importación masiva
export interface ImportExcelResult {
  inserted: number;
  errors: string[] | null;
}

export const importExcelProducts = async (data: Record<string, unknown>[]): Promise<ImportExcelResult> => {
  const response = await api.post("/productos/import/excel", { data });
  return { inserted: response.data?.inserted ?? 0, errors: response.data?.errors ?? null };
};

// 5. CRUD de Marcas
export const createBrand = async (brand: { nombre: string; estado?: number }): Promise<boolean> => {
  const payload = {
    nom_marca: brand.nombre,
    estado_marca: brand.estado ?? 1
  };
  const response = await api.post("/marcas", payload);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

export const updateBrand = async (id: number, brand: { nombre: string; estado?: number }): Promise<boolean> => {
  const payload = {
    nom_marca: brand.nombre,
    estado_marca: brand.estado ?? 1
  };
  const response = await api.put(`/marcas/update/${id}`, payload);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

/**
 * Verifica si una marca está siendo usada por productos.
 * @returns { used: boolean, productCount: number }
 */
export const checkBrandUsage = async (id: number): Promise<{ used: boolean; productCount: number }> => {
  const response = await api.get(`/marcas/check-usage/${id}`);
  return response.data;
};

/**
 * Elimina una marca. Si está asociada a productos, la desactiva (soft delete).
 * Si no, la elimina permanentemente (hard delete).
 * @returns { success: boolean, mode: 'deleted' | 'deactivated', message: string }
 */
export const deleteBrand = async (id: number): Promise<{ success: boolean; mode: 'deleted' | 'deactivated'; message: string }> => {
  const response = await api.delete(`/marcas/${id}`);
  const data = response.data;
  return {
    success: data?.code === 1,
    mode: data?.mode ?? 'deleted',
    message: data?.message ?? ''
  };
};

// 6. CRUD de Categorías
export const createCategory = async (category: { nombre: string; estado?: number }): Promise<boolean> => {
  const payload = {
    nom_categoria: category.nombre,
    estado_categoria: category.estado ?? 1
  };
  const response = await api.post("/categorias", payload);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

export const updateCategory = async (id: number, category: { nombre: string; estado?: number }): Promise<boolean> => {
  const payload = {
    nom_categoria: category.nombre,
    estado_categoria: category.estado ?? 1
  };
  const response = await api.put(`/categorias/update/${id}`, payload);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

/**
 * Verifica si una categoría está siendo usada por subcategorías.
 * @returns { used: boolean, subcategoryCount: number }
 */
export const checkCategoryUsage = async (id: number): Promise<{ used: boolean; subcategoryCount: number }> => {
  const response = await api.get(`/categorias/check-usage/${id}`);
  return response.data;
};

/**
 * Elimina una categoría. Si tiene subcategorías asociadas, la desactiva.
 * Si no, la elimina permanentemente.
 * @returns { success: boolean, mode: 'deleted' | 'deactivated', message: string }
 */
export const deleteCategory = async (id: number): Promise<{ success: boolean; mode: 'deleted' | 'deactivated'; message: string }> => {
  const response = await api.delete(`/categorias/${id}`);
  const data = response.data;
  return {
    success: data?.code === 1,
    mode: data?.mode ?? 'deleted',
    message: data?.message ?? ''
  };
};

// 7. CRUD de Subcategorías
export const createSubcategory = async (subcategory: { nombre_sub: string; id_categoria: number }): Promise<boolean> => {
  const response = await api.post("/subcategorias", subcategory);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

export const updateSubcategory = async (id: number, subcategory: { nombre_sub: string; id_categoria: number }): Promise<boolean> => {
  const response = await api.put(`/subcategorias/update/${id}`, subcategory);
  const data = response.data;
  return data?.code === 1 || data?.success === true || data === true;
};

/**
 * Verifica si una subcategoría está siendo usada por productos.
 * @returns { used: boolean, productCount: number }
 */
export const checkSubcategoryUsage = async (id: number): Promise<{ used: boolean; productCount: number }> => {
  const response = await api.get(`/subcategorias/check-usage/${id}`);
  return response.data;
};

/**
 * Elimina una subcategoría. Si está asociada a productos, la desactiva.
 * Si no, la elimina permanentemente.
 * @returns { success: boolean, mode: 'deleted' | 'deactivated', message: string }
 */
export const deleteSubcategory = async (id: number): Promise<{ success: boolean; mode: 'deleted' | 'deactivated'; message: string }> => {
  const response = await api.delete(`/subcategorias/${id}`);
  const data = response.data;
  return {
    success: data?.code === 1,
    mode: data?.mode ?? 'deleted',
    message: data?.message ?? ''
  };
};

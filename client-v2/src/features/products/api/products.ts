import api from "@/api/axios";
import type { Product, Brand, Category, Subcategory, UnitOfMeasure, ProductAttribute, AttributeValue, ProductVariant } from "../types";

// 1. Productos CRUD
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get("/productos");
  return response.data?.success ? response.data.data : (response.data || []);
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/productos/${id}`);
  return response.data?.data || response.data;
};

export const getLastIdProducto = async (): Promise<number> => {
  const response = await api.get("/productos/lastid");
  return response.data?.success ? response.data.data : response.data;
};

export const createProduct = async (product: Omit<Product, "id_producto">): Promise<{ success: boolean; id_producto: number }> => {
  const response = await api.post("/productos", product);
  return response.data;
};

export const updateProduct = async (id: number, product: Omit<Product, "id_producto">): Promise<boolean> => {
  const response = await api.put(`/productos/${id}`, product);
  return response.data?.success || response.data === true;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/productos/${id}`);
  return response.data?.success || response.data === true;
};

// 2. Marcas, Categorías y Subcategorías
export const getBrands = async (): Promise<Brand[]> => {
  const response = await api.get("/marcas");
  return response.data?.success ? response.data.data : (response.data || []);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/categorias");
  return response.data?.success ? response.data.data : (response.data || []);
};

export const getSubcategories = async (): Promise<Subcategory[]> => {
  const response = await api.get("/subcategorias");
  const data = response.data?.data || response.data || [];
  
  if (Array.isArray(data)) {
    return data.map((sub: any) => ({
      id_subcategoria: Number(sub.id_subcategoria),
      id_categoria: Number(sub.id_categoria),
      nombre_sub: String(sub.nombre_sub || sub.nombre || ''),
      nom_categoria: String(sub.nom_categoria || ''),
      estado: sub.estado
    }));
  }
  return [];
};

// 3. Unidades de medida
export const getUnits = async (): Promise<UnitOfMeasure[]> => {
  const response = await api.get("/unidades");
  const list = response.data?.success ? response.data.data : (response.data || []);
  return list.filter((u: any) => u.estado === 1 || u.estado === '1');
};

// 4. Atributos dinámicos y variantes
export const getCategoryAttributes = async (catId: number | string): Promise<ProductAttribute[]> => {
  const response = await api.get(`/attributes/category/${catId}`);
  return response.data?.success ? response.data.data : (response.data || []);
};

export const getAttributeValues = async (attrId: number | string): Promise<AttributeValue[]> => {
  const response = await api.get(`/attributes/${attrId}/values`);
  return response.data?.success ? response.data.data : (response.data || []);
};

export const getProductAttributes = async (productId: number): Promise<{ attributes: { id_atributo: number; values: { id: number; label: string }[] }[] }> => {
  const response = await api.get(`/productos/${productId}/attributes`);
  return response.data;
};

export const getProductVariants = async (productId: number): Promise<ProductVariant[]> => {
  const response = await api.get(`/productos/${productId}/variants`);
  return response.data?.success ? response.data.data : (response.data || []);
};

export const generateSKUs = async (productId: number, data: { id_atributo: number; values: { id: string | number; label: string }[] }[]): Promise<any> => {
  const response = await api.post("/productos/skus/generate", {
    id_producto: productId,
    attributes: data
  });
  return response.data;
};

export const importExcelProducts = async (data: any[]): Promise<any> => {
  const response = await api.post("/productos/import/excel", { data });
  return response.data;
};

// 5. CRUD de Marcas
export const createBrand = async (brand: { nombre: string }): Promise<boolean> => {
  const response = await api.post("/marcas", brand);
  return response.data?.success || response.data === true;
};

export const updateBrand = async (id: number, brand: { nombre: string }): Promise<boolean> => {
  const response = await api.put(`/marcas/update/${id}`, brand);
  return response.data?.success || response.data === true;
};

export const deleteBrand = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/marcas/${id}`);
  return response.data?.success || response.data === true;
};

// 6. CRUD de Categorías
export const createCategory = async (category: { nombre: string }): Promise<boolean> => {
  const response = await api.post("/categorias", category);
  return response.data?.success || response.data === true;
};

export const updateCategory = async (id: number, category: { nombre: string }): Promise<boolean> => {
  const response = await api.put(`/categorias/update/${id}`, category);
  return response.data?.success || response.data === true;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/categorias/${id}`);
  return response.data?.success || response.data === true;
};

// 7. CRUD de Subcategorías
export const createSubcategory = async (subcategory: { nombre_sub: string; id_categoria: number }): Promise<boolean> => {
  const response = await api.post("/subcategorias", subcategory);
  return response.data?.success || response.data === true;
};

export const updateSubcategory = async (id: number, subcategory: { nombre_sub: string; id_categoria: number }): Promise<boolean> => {
  const response = await api.put(`/subcategorias/update/${id}`, subcategory);
  return response.data?.success || response.data === true;
};

export const deleteSubcategory = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/subcategorias/${id}`);
  return response.data?.success || response.data === true;
};

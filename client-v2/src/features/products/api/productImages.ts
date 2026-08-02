import api from "@/api/axios";
import { isOk, unwrapList } from "@/api/http";
import { fileToBase64 } from "@/lib/file";

export interface ProductImage {
  id_imagen: number;
  url: string;
  es_principal: boolean;
  orden: number;
}

export interface TenantProductImage {
  id_imagen: number;
  id_producto: number;
  nom_producto: string;
  cod_producto?: string;
  url: string;
  file_id?: string;
  es_principal: boolean;
  orden: number;
}

export const listProductImages = async (idProducto: number): Promise<ProductImage[]> =>
  unwrapList<ProductImage>(await api.get(`/productos/${idProducto}/images`));

export const listAllProductImages = async (): Promise<TenantProductImage[]> =>
  unwrapList<TenantProductImage>(await api.get("/productos/images/all"));

export const uploadProductImage = async (idProducto: number, file: File): Promise<boolean> => {
  const base64 = await fileToBase64(file);
  return isOk(await api.post(`/productos/${idProducto}/images`, { file: base64, fileName: file.name }));
};

export const deleteProductImage = async (idProducto: number, idImagen: number): Promise<boolean> =>
  isOk(await api.delete(`/productos/${idProducto}/images/${idImagen}`));

export const reorderProductImages = async (
  idProducto: number,
  orden: { id_imagen: number; orden: number }[]
): Promise<boolean> =>
  isOk(await api.put(`/productos/${idProducto}/images/reorder`, { orden }));

export const setPrincipalProductImage = async (idProducto: number, idImagen: number): Promise<boolean> =>
  isOk(await api.put(`/productos/${idProducto}/images/${idImagen}/principal`));

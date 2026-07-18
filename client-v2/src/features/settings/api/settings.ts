import api from "@/api/axios";
import { isOk, unwrapOne } from "@/api/http";
import type { Negocio, NegocioInput } from "../types";

export const getNegocio = async (): Promise<Negocio | null> =>
  unwrapOne<Negocio>(await api.get("/negocio"));

/**
 * Convierte un File a base64 para subir a ImageKit.
 */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remover prefijo "data:image/...;base64," para enviar solo el payload
      const base64 = result.replace(/^data:image\/\w+;base64,/, "");
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Sube un archivo a ImageKit vía el backend (POST /api/uploads/logo).
 * Devuelve la URL de ImageKit.
 */
const uploadLogoToImageKit = async (file: File): Promise<string> => {
  const base64 = await fileToBase64(file);
  const res = await api.post("/uploads/logo", { file: base64 });
  if (!res.data?.success) throw new Error(res.data?.message ?? "Error subiendo a ImageKit");
  return res.data.url as string; // URL pública de ImageKit
};

/**
 * Actualiza los datos del negocio.
 * - Si se adjunta un logo nuevo → sube a ImageKit → guarda la URL en BD.
 * - Si no hay logo → solo actualiza los datos restantes.
 */
export const updateNegocio = async (input: NegocioInput, logo?: File | null): Promise<boolean> => {
  const payload: Record<string, unknown> = { ...input };

  if (logo) {
    // 1. Subir archivo a ImageKit
    const imageKitUrl = await uploadLogoToImageKit(logo);
    // 2. Guardar la URL de ImageKit en la BD (no el archivo local)
    payload.logotipo = imageKitUrl;
  }

  return isOk(await api.put("/negocio", payload));
};

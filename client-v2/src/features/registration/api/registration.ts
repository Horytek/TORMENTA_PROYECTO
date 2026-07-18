import api from "@/api/axios";
import type { EmpresaRegisterInput, UsuarioLandingInput } from "../types";

export const addEmpresaPublic = async (
  input: EmpresaRegisterInput
): Promise<{ success: boolean; id_empresa?: number; message?: string }> => {
  try {
    const res = await api.post("/empresa", input);
    return { success: res.data?.code === 1, id_empresa: res.data?.id_empresa, message: res.data?.message };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "No se pudo registrar la empresa." };
  }
};

export const addUsuarioLandingPublic = async (
  input: UsuarioLandingInput
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post("/usuario/landing", input);
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: message || "No se pudo crear el usuario administrador." };
  }
};

const CREDENTIAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const randomString = (len = 12) =>
  Array.from({ length: len }, () => CREDENTIAL_CHARS[Math.floor(Math.random() * CREDENTIAL_CHARS.length)]).join("");
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");
const slug = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10);

/** El admin nunca ve estas credenciales en pantalla: llegan por correo cuando el webhook de MercadoPago confirma el pago. */
export const generateAdminCredentials = (seed: string) => ({
  usua: `${slug(seed) || "admin"}${Math.floor(1000 + Math.random() * 9000)}`,
  contra: randomString(12),
});

/** Coincide con PLANS_CONFIG del backend (src/config/plans.config.js): Básico=3, Pro=2, Enterprise=1. */
export const PLAN_PAGO_MAP: Record<string, number> = { basico: 3, pro: 2, enterprise: 1 };

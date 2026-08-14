import { isAxiosError } from "axios";

/** Mensaje legible desde errores axios del backend ecommerce. */
export function apiErrorMessage(error: unknown, fallback = "No se pudo completar la operación"): string {
  if (isAxiosError(error)) {
    const raw = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(raw?.message)) return raw.message.join(". ");
    if (typeof raw?.message === "string" && raw.message.trim()) return raw.message;
  }
  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
    return error.message;
  }
  return fallback;
}

import type { AxiosError } from "axios";

/**
 * Motivos de rechazo 403 que el backend emite de forma estructurada
 * (Fase 4.1 de PLAN_PERMISOS_PLAN_ROLES.md). Antes todos los 403 eran un
 * "No tienes permiso" indistinguible; ahora el frontend puede reaccionar
 * distinto a "mejora tu plan" vs "sin permiso" vs "suscripción suspendida".
 */
export type AuthzDenialCode = "ROLE_DENIED" | "PLAN_NOT_INCLUDED" | "TENANT_SUSPENDED";

export interface AuthzDenial {
  code: AuthzDenialCode;
  message: string;
  /** Método HTTP del request denegado — el toast global solo reacciona a
   *  acciones del usuario (POST/PUT/DELETE/PATCH), no a GETs de fondo. */
  method?: string;
}

/** true si el request nació de una acción explícita del usuario (mutación). */
export function isUserAction(method?: string): boolean {
  const m = (method || "").toUpperCase();
  return m === "POST" || m === "PUT" || m === "DELETE" || m === "PATCH";
}

const KNOWN_CODES: AuthzDenialCode[] = ["ROLE_DENIED", "PLAN_NOT_INCLUDED", "TENANT_SUSPENDED"];

/** Mensajes por defecto (el backend ya manda uno, esto es fallback de UI). */
export const DENIAL_COPY: Record<AuthzDenialCode, { title: string; cta?: string }> = {
  ROLE_DENIED: { title: "No tienes permiso para esta acción." },
  PLAN_NOT_INCLUDED: { title: "Tu plan no incluye esta función.", cta: "Mejorar plan" },
  TENANT_SUSPENDED: { title: "La suscripción está suspendida.", cta: "Ver facturación" },
};

/**
 * Extrae el motivo estructurado de un error de axios. Devuelve `null` si no es
 * un 403 con `code` conocido (para que el caller use su manejo genérico).
 */
export function parseAuthzDenial(err: unknown): AuthzDenial | null {
  const e = err as AxiosError<{ code?: string; message?: string }> | undefined;
  if (e?.response?.status !== 403) return null;
  const code = e.response.data?.code;
  if (!code || !KNOWN_CODES.includes(code as AuthzDenialCode)) return null;
  return {
    code: code as AuthzDenialCode,
    message: e.response.data?.message || DENIAL_COPY[code as AuthzDenialCode].title,
    method: e.config?.method,
  };
}

/** Evento global emitido por el interceptor de axios ante un 403 estructurado. */
export const AUTHZ_DENIED_EVENT = "authz:denied";

export function emitAuthzDenied(denial: AuthzDenial): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthzDenial>(AUTHZ_DENIED_EVENT, { detail: denial }));
}

/**
 * Suscribe un handler a los rechazos 403 estructurados (para un toast/modal
 * global cuando exista). Devuelve la función de limpieza.
 */
export function onAuthzDenied(handler: (denial: AuthzDenial) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<AuthzDenial>).detail);
  window.addEventListener(AUTHZ_DENIED_EVENT, listener);
  return () => window.removeEventListener(AUTHZ_DENIED_EVENT, listener);
}

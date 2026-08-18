import type { AtelierBriefJson } from "./types";

/** Solo vitrina. Los cobros (MP) siguen en PEN; Polar Pro es US$ 9. No cotiza FX en vivo. */
export const PEN_PER_USD = 3.7;

export function toPenNumber(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Soles peruanos ya guardados en BD — no recalcular comisión aquí. */
export function formatSol(value: number | string | null | undefined) {
  const n = toPenNumber(value);
  if (n == null) return "S/ 0";
  const shown = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `S/ ${shown}`;
}

export function formatUsdFromPen(value: number | string | null | undefined) {
  const n = toPenNumber(value);
  if (n == null) return "US$ 0";
  return `US$ ${Math.round(n / PEN_PER_USD)}`;
}

/** Par de vitrina. Nunca usar para calcular fee de plataforma. */
export function formatMoneyPair(value: number | string | null | undefined) {
  return `${formatSol(value)} · ${formatUsdFromPen(value)}`;
}

export function formatFromPrice(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const n = toPenNumber(value);
  if (n == null) return null;
  return `Desde ${formatMoneyPair(n)}`;
}

export function atelierGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function atelierApiError(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err as Error).message ||
    fallback
  );
}

export function parseBrief(raw: unknown): AtelierBriefJson | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AtelierBriefJson;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as AtelierBriefJson;
  return null;
}

export function slugFromName(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base.length >= 2 ? base : `artista-${Date.now().toString(36)}`;
}

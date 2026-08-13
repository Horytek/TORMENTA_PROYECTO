import type { AttrSnapshotItem } from "../types/storefront";

export function parseAttrsSnapshot(raw: unknown): AttrSnapshotItem[] {
  if (!raw) return [];
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => ({
      id_atributo: Number(x?.id_atributo) || 0,
      nombre: String(x?.nombre || ""),
      tipo: x?.tipo ? String(x.tipo) : undefined,
      valor: String(x?.valor ?? ""),
      hex: x?.hex ? String(x.hex) : null,
    }))
    .filter((x) => x.nombre && x.valor);
}

export function formatAttrsSnapshot(raw: unknown): string {
  return parseAttrsSnapshot(raw)
    .map((a) => `${a.nombre}: ${a.valor}`)
    .join(" · ");
}

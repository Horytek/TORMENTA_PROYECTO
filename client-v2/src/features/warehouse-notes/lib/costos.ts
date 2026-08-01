import type { NoteFormItem } from "../types";

/**
 * true si algunas líneas tienen costo y otras no. Ninguno de los dos estados
 * (mandar todo, mandar nada) es seguro: el backend hace `Number(costos[i])`,
 * y una línea sin costo viaja como `null` en el JSON — `Number(null)` es `0`,
 * así que un hueco se registraría como costo real de S/0. Se bloquea el envío
 * hasta que sea todo o nada.
 */
export function costosIncompletos(items: NoteFormItem[]): boolean {
  const conCosto = items.filter((i) => i.costo !== null).length;
  return conCosto > 0 && conCosto < items.length;
}

/** Costos por línea para el payload, o `undefined` si esta nota no está capturando costo. */
export function costosParaPayload(items: NoteFormItem[]): number[] | undefined {
  if (items.length === 0 || items.some((i) => i.costo === null)) return undefined;
  return items.map((i) => i.costo as number);
}

import { describe, it, expect } from "vitest";
import {
  normalizarCosto,
  decidirCargaInicial,
  planificarCargaProducto,
  RESULTADO,
  CostoInvalidoError,
} from "./costoInicial.js";

/**
 * La carga inicial es la única vez que un humano escribe el costo a mano, y de
 * ese número sale después el margen de toda la tienda. Los casos que importan
 * son los de basura entrando (campo vacío, cero, texto) y el de no destruir un
 * costo que vino de una compra real.
 */

describe("normalizarCosto", () => {
  it("acepta números y strings numéricos", () => {
    expect(normalizarCosto(20)).toBe(20);
    expect(normalizarCosto("35.50")).toBe(35.5);
  });

  it("redondea a 4 decimales, como el resto del módulo de costos", () => {
    expect(normalizarCosto(12.3456789)).toBe(12.3457);
  });

  it("rechaza el cero: casi siempre es un campo vacío y dispara margen 100%", () => {
    expect(() => normalizarCosto(0)).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto("0")).toThrow(CostoInvalidoError);
  });

  it("rechaza vacío, null y undefined en vez de convertirlos en 0", () => {
    // Number("") y Number(null) son 0 — el bug clásico de este repo.
    expect(() => normalizarCosto("")).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto("   ")).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto(null)).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto(undefined)).toThrow(CostoInvalidoError);
  });

  it("rechaza texto, negativos e infinitos", () => {
    expect(() => normalizarCosto("veinte soles")).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto(-5)).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto(Infinity)).toThrow(CostoInvalidoError);
    expect(() => normalizarCosto(NaN)).toThrow(CostoInvalidoError);
  });

  it("rechaza un costo absurdo, que suele ser un precio mal tipeado", () => {
    expect(() => normalizarCosto(99_999_999)).toThrow(CostoInvalidoError);
  });
});

describe("decidirCargaInicial", () => {
  it("aplica cuando el SKU nunca tuvo costo", () => {
    const d = decidirCargaInicial({ costoActual: null });
    expect(d.aplica).toBe(true);
    expect(d.resultado).toBe(RESULTADO.APLICA);
  });

  it("NO pisa un costo que vino de una compra real", () => {
    const d = decidirCargaInicial({ costoActual: 18.5 });
    expect(d.aplica).toBe(false);
    expect(d.resultado).toBe(RESULTADO.YA_TENIA_COSTO);
  });

  it("lo pisa solo si se pide explícitamente", () => {
    const d = decidirCargaInicial({ costoActual: 18.5, forzar: true });
    expect(d.aplica).toBe(true);
    expect(d.resultado).toBe(RESULTADO.SOBRESCRIBE);
  });

  it("trata un costo_promedio en 0 como desconocido, no como costo válido", () => {
    // Un 0 guardado es basura histórica; si lo respetáramos, ese SKU nunca
    // podría cargarse y su margen quedaría en 100% para siempre.
    expect(decidirCargaInicial({ costoActual: 0 }).aplica).toBe(true);
  });
});

describe("planificarCargaProducto", () => {
  const skus = [
    { id_sku: 1, costoActual: null },
    { id_sku: 2, costoActual: 22 },
    { id_sku: 3, costoActual: null },
  ];

  it("carga solo los SKU sin costo y deja intacto el que ya tenía", () => {
    const p = planificarCargaProducto({ skus, costo: 30 });
    expect(p.aplicar).toEqual([
      { id_sku: 1, costo: 30 },
      { id_sku: 3, costo: 30 },
    ]);
    expect(p.omitidos).toEqual([2]);
  });

  it("con forzar alcanza a todos", () => {
    const p = planificarCargaProducto({ skus, costo: 30, forzar: true });
    expect(p.aplicar).toHaveLength(3);
    expect(p.omitidos).toEqual([]);
  });

  it("valida el costo una sola vez, antes de tocar ningún SKU", () => {
    // Si el costo es basura no se aplica a nadie: nada de dejar la mitad
    // de un producto cargada con un valor inválido.
    expect(() => planificarCargaProducto({ skus, costo: 0 })).toThrow(CostoInvalidoError);
  });

  it("un producto sin SKU no revienta", () => {
    expect(planificarCargaProducto({ skus: [], costo: 10 })).toEqual({ aplicar: [], omitidos: [] });
    expect(planificarCargaProducto({ skus: undefined, costo: 10 })).toEqual({ aplicar: [], omitidos: [] });
  });
});

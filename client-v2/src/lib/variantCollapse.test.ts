import { describe, it, expect } from "vitest";
import { collapseVariants } from "./variantCollapse";

const variants = [
  { id_sku: 1, attrs: { "10": "Rojo", "20": "M", "30": "Algodón" }, stock: 5 },
  { id_sku: 2, attrs: { "10": "Rojo", "20": "L", "30": "Algodón" }, stock: 3 },
  { id_sku: 3, attrs: { "10": "Azul", "20": "M", "30": "Algodón" }, stock: 7 },
];

describe("collapseVariants", () => {
  it("con todos los atributos activos, no colapsa nada", () => {
    const result = collapseVariants(variants, [10, 20, 30]);
    expect(result).toHaveLength(3);
  });

  it("desactivar Color (10) y Material (30) agrupa Rojo+M y Azul+M en una sola fila 'M'", () => {
    const result = collapseVariants(variants, [20]);
    expect(result).toHaveLength(2);
    const m = result.find((r) => r.label === "M");
    expect(m?.stock).toBe(12); // 5 (Rojo+M) + 7 (Azul+M)
    expect(m?.id_skus.sort()).toEqual([1, 3]);
    const l = result.find((r) => r.label === "L");
    expect(l?.stock).toBe(3);
  });

  it("sin atributos activos, todo colapsa a un solo grupo 'Sin variante'", () => {
    const result = collapseVariants(variants, []);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Sin variante");
    expect(result[0].stock).toBe(15);
    expect(result[0].id_skus).toHaveLength(3);
  });

  it("el orden de los atributos en attrs no afecta el agrupamiento (se ordena por id)", () => {
    const a = { id_sku: 1, attrs: { "20": "M", "10": "Rojo" }, stock: 1 };
    const b = { id_sku: 2, attrs: { "10": "Rojo", "20": "M" }, stock: 1 };
    const result = collapseVariants([a, b], [10, 20]);
    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(2);
  });
});

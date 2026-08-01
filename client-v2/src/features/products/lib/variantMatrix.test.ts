import { describe, it, expect } from "vitest";
import { cartesianCombos, comboKey, comboLabel, deriveVariantMode } from "./variantMatrix";
import type { ProductAttribute } from "../types";

const talla: ProductAttribute = {
  id_atributo: 20,
  nombre: "Talla",
  values: [{ id_valor: 201, valor: "M" }, { id_valor: 202, valor: "L" }],
};
const color: ProductAttribute = {
  id_atributo: 10,
  nombre: "Color",
  values: [{ id_valor: 101, valor: "Rojo" }, { id_valor: 102, valor: "Azul" }],
};
const material: ProductAttribute = {
  id_atributo: 30,
  nombre: "Material",
  values: [{ id_valor: 301, valor: "Algodón" }],
};

describe("deriveVariantMode", () => {
  it("clasifica según cuántos atributos tienen valores elegidos", () => {
    expect(deriveVariantMode([])).toBe("sin_variantes");
    expect(deriveVariantMode([talla])).toBe("lista_simple");
    expect(deriveVariantMode([talla, color])).toBe("grilla_2d");
    expect(deriveVariantMode([talla, color, material])).toBe("tabla_nd");
  });
});

describe("cartesianCombos", () => {
  it("genera 2x2x1 = 4 combinaciones para 3 dimensiones", () => {
    const sel = { 20: ["201", "202"], 10: ["101", "102"], 30: ["301"] };
    const combos = cartesianCombos([talla, color, material], sel);
    expect(combos).toHaveLength(4);
  });

  it("vacío si algún atributo no tiene ningún valor seleccionado", () => {
    const sel = { 20: ["201"], 10: [], 30: ["301"] };
    expect(cartesianCombos([talla, color, material], sel)).toHaveLength(0);
  });
});

describe("comboKey / comboLabel", () => {
  it("son estables sin importar el orden de entrada (se ordena por id_atributo)", () => {
    const a = [{ id_atributo: 20, id_valor: 201, valor: "M" }, { id_atributo: 10, id_valor: 101, valor: "Rojo" }];
    const b = [{ id_atributo: 10, id_valor: 101, valor: "Rojo" }, { id_atributo: 20, id_valor: 201, valor: "M" }];
    expect(comboKey(a)).toBe(comboKey(b));
    expect(comboLabel(a)).toBe("Rojo / M");
  });
});

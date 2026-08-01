import { describe, it, expect } from "vitest";
import { costosIncompletos, costosParaPayload } from "./costos";
import type { NoteFormItem } from "../types";

function item(costo: number | null): NoteFormItem {
  return {
    uniqueKey: `k-${costo}-${Math.random()}`,
    codigo: 1,
    descripcion: "Polo",
    marca: "Marca",
    cantidad: 1,
    id_tonalidad: null,
    id_talla: null,
    id_sku: null,
    nombre_tonalidad: null,
    nombre_talla: null,
    sku_label: null,
    costo,
  };
}

describe("costosIncompletos", () => {
  it("sin items no está incompleto", () => {
    expect(costosIncompletos([])).toBe(false);
  });

  it("ningún costo ingresado no está incompleto", () => {
    expect(costosIncompletos([item(null), item(null)])).toBe(false);
  });

  it("todos con costo no está incompleto", () => {
    expect(costosIncompletos([item(10), item(20)])).toBe(false);
  });

  it("mezcla de con/sin costo sí está incompleto", () => {
    expect(costosIncompletos([item(10), item(null)])).toBe(true);
  });
});

describe("costosParaPayload", () => {
  it("sin items devuelve undefined", () => {
    expect(costosParaPayload([])).toBeUndefined();
  });

  it("ningún costo ingresado devuelve undefined (nota sin captura de costo)", () => {
    expect(costosParaPayload([item(null), item(null)])).toBeUndefined();
  });

  it("costo parcial devuelve undefined (nunca manda un null disfrazado de 0)", () => {
    expect(costosParaPayload([item(10), item(null)])).toBeUndefined();
  });

  it("todos con costo devuelve el arreglo paralelo", () => {
    expect(costosParaPayload([item(10), item(20.5)])).toEqual([10, 20.5]);
  });
});

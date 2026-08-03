import { describe, it, expect } from "vitest";
import { clasificarBcg } from "./bcg";
import type { MargenProducto } from "../types";

function producto(overrides: Partial<MargenProducto> = {}): MargenProducto {
  return {
    id_producto: 1,
    descripcion: "Polo",
    marca: "Marca",
    unidades: 10,
    unidadesConCosto: 10,
    ingreso: 100,
    costo: 50,
    margen: 50,
    porcentaje: 50,
    margenPorUnidad: 5,
    completo: true,
    ...overrides,
  };
}

describe("clasificarBcg", () => {
  it("separa por la mediana del propio conjunto, no un umbral fijo", () => {
    const productos = [
      producto({ id_producto: 1, unidades: 100, porcentaje: 60 }), // alto vol, alto margen
      producto({ id_producto: 2, unidades: 100, porcentaje: 10 }), // alto vol, bajo margen
      producto({ id_producto: 3, unidades: 5, porcentaje: 60 }), // bajo vol, alto margen
      producto({ id_producto: 4, unidades: 5, porcentaje: 10 }), // bajo vol, bajo margen
    ];
    const { puntos } = clasificarBcg(productos);
    const porId = new Map(puntos.map((p) => [p.producto.id_producto, p.cuadrante]));
    expect(porId.get(1)).toBe("estrella");
    expect(porId.get(2)).toBe("vaca_lechera");
    expect(porId.get(3)).toBe("interrogante");
    expect(porId.get(4)).toBe("perro");
  });

  it("excluye productos sin margen conocido (porcentaje null)", () => {
    const productos = [producto({ id_producto: 1, porcentaje: null }), producto({ id_producto: 2 })];
    const { puntos } = clasificarBcg(productos);
    expect(puntos).toHaveLength(1);
    expect(puntos[0].producto.id_producto).toBe(2);
  });

  it("un solo producto empata con su propia mediana y cae del lado alto en ambos ejes", () => {
    const { puntos } = clasificarBcg([producto()]);
    expect(puntos[0].cuadrante).toBe("estrella");
  });

  it("sin productos no rompe, devuelve listas y medianas en cero", () => {
    const { puntos, medianaUnidades, medianaMargen } = clasificarBcg([]);
    expect(puntos).toEqual([]);
    expect(medianaUnidades).toBe(0);
    expect(medianaMargen).toBe(0);
  });
});

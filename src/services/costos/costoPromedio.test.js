import { describe, it, expect } from "vitest";
import {
  recalcularCostoPromedio,
  calcularMargenLinea,
  valorizarStock,
  costoDeLineaRepartida,
  MOTIVO,
} from "./costoPromedio.js";

/**
 * De esto sale el número que el sistema le va a decir al dueño de la tienda:
 * "ganas S/18 por este polo". Si el cálculo miente, miente el argumento con el
 * que se vende el producto — así que los casos borde importan más que de
 * costumbre, sobre todo los de stock o costo desconocido.
 */

describe("recalcularCostoPromedio", () => {
  it("pondera contra el stock existente", () => {
    // 10 unidades a 20 + 10 unidades a 30 = 20 unidades a 25.
    const r = recalcularCostoPromedio({ stockActual: 10, costoActual: 20, cantidadIngreso: 10, costoIngreso: 30 });
    expect(r.costoPromedio).toBe(25);
    expect(r.motivo).toBe(MOTIVO.PROMEDIO);
    expect(r.stockResultante).toBe(20);
    expect(r.estimado).toBe(false);
  });

  it("pondera por cantidad, no por partes iguales", () => {
    // 90 unidades a 10 + 10 a 20 → 11, no 15.
    const r = recalcularCostoPromedio({ stockActual: 90, costoActual: 10, cantidadIngreso: 10, costoIngreso: 20 });
    expect(r.costoPromedio).toBe(11);
  });

  it("sin stock previo, el costo entrante es el costo", () => {
    const r = recalcularCostoPromedio({ stockActual: 0, costoActual: 50, cantidadIngreso: 5, costoIngreso: 32 });
    expect(r.costoPromedio).toBe(32);
    expect(r.motivo).toBe(MOTIVO.SIN_STOCK);
  });

  it("marca el primer costo de un SKU que nunca tuvo", () => {
    const r = recalcularCostoPromedio({ stockActual: 0, costoActual: null, cantidadIngreso: 5, costoIngreso: 32 });
    expect(r.costoPromedio).toBe(32);
    expect(r.motivo).toBe(MOTIVO.PRIMER_COSTO);
  });

  describe("stock sin costo conocido — el caso de esta base de datos", () => {
    // Hoy hay 3103 registros de stock y ninguno tiene costo. El primer ingreso
    // con costo se encuentra con stock previo sin valorizar.
    it("adopta el costo entrante y lo marca como estimado", () => {
      const r = recalcularCostoPromedio({ stockActual: 40, costoActual: null, cantidadIngreso: 10, costoIngreso: 25 });
      expect(r.costoPromedio).toBe(25);
      expect(r.motivo).toBe(MOTIVO.STOCK_SIN_COSTO);
      expect(r.estimado).toBe(true);
    });

    it("NO pondera contra cero, que hundiría el costo", () => {
      // Ponderar 40 unidades a costo 0 daría 5 en vez de 25, y el margen
      // saldría inflado justo en los artículos más antiguos.
      const r = recalcularCostoPromedio({ stockActual: 40, costoActual: 0, cantidadIngreso: 10, costoIngreso: 25 });
      expect(r.costoPromedio).toBe(25);
      expect(r.costoPromedio).not.toBe(5);
    });
  });

  it("un stock negativo por sobreventa no arrastra el promedio", () => {
    const r = recalcularCostoPromedio({ stockActual: -5, costoActual: 20, cantidadIngreso: 10, costoIngreso: 30 });
    expect(r.costoPromedio).toBe(30);
    expect(r.stockResultante).toBe(10);
  });

  it("acepta costo cero (muestras, promociones)", () => {
    const r = recalcularCostoPromedio({ stockActual: 10, costoActual: 20, cantidadIngreso: 10, costoIngreso: 0 });
    expect(r.costoPromedio).toBe(10);
  });

  it("conserva decimales suficientes para no derivar con el tiempo", () => {
    // 3 a 10 + 1 a 11 = 10.25; con 2 decimales igual, pero el caso 1/3 no.
    const r = recalcularCostoPromedio({ stockActual: 2, costoActual: 10, cantidadIngreso: 1, costoIngreso: 11 });
    expect(r.costoPromedio).toBeCloseTo(10.333333, 5);
  });

  it("rechaza entradas inválidas en vez de guardar un costo absurdo", () => {
    const base = { stockActual: 10, costoActual: 20 };
    expect(() => recalcularCostoPromedio({ ...base, cantidadIngreso: 0, costoIngreso: 5 })).toThrow(/cantidad/i);
    expect(() => recalcularCostoPromedio({ ...base, cantidadIngreso: -3, costoIngreso: 5 })).toThrow(/cantidad/i);
    expect(() => recalcularCostoPromedio({ ...base, cantidadIngreso: 5, costoIngreso: -1 })).toThrow(/costo/i);
    expect(() => recalcularCostoPromedio({ ...base, cantidadIngreso: 5, costoIngreso: "abc" })).toThrow(/costo/i);
  });
});

describe("calcularMargenLinea", () => {
  it("calcula margen e importe sobre el costo de esa venta", () => {
    const r = calcularMargenLinea({ precio: 59, descuento: 0, cantidad: 2, costoUnitario: 32 });
    expect(r.ingreso).toBe(118);
    expect(r.costo).toBe(64);
    expect(r.margen).toBe(54);
    expect(r.porcentaje).toBeCloseTo(45.76, 1);
  });

  it("descuenta antes de calcular el margen", () => {
    const r = calcularMargenLinea({ precio: 59, descuento: 9, cantidad: 1, costoUnitario: 32 });
    expect(r.ingreso).toBe(50);
    expect(r.margen).toBe(18);
  });

  it("sin costo conocido devuelve sinCosto, no un margen de 100%", () => {
    // Es el estado de todas las ventas históricas. Mostrar 100% haría ver
    // rentable todo el catálogo.
    const r = calcularMargenLinea({ precio: 59, cantidad: 1, costoUnitario: null });
    expect(r.sinCosto).toBe(true);
    expect(r.porcentaje).toBeNull();
    expect(r.margen).toBe(0);
  });

  it("acepta margen negativo: vender bajo costo es un dato, no un error", () => {
    // Es justo lo que el dueño necesita ver cuando remata la temporada pasada.
    const r = calcularMargenLinea({ precio: 20, cantidad: 1, costoUnitario: 32 });
    expect(r.margen).toBe(-12);
    expect(r.porcentaje).toBe(-60);
  });

  it("un descuento mayor al precio no genera ingreso negativo", () => {
    const r = calcularMargenLinea({ precio: 50, descuento: 80, cantidad: 1, costoUnitario: 10 });
    expect(r.ingreso).toBe(0);
    expect(r.margen).toBe(-10);
  });

  it("un regalo (costo 0) da margen completo", () => {
    const r = calcularMargenLinea({ precio: 59, cantidad: 1, costoUnitario: 0 });
    expect(r.sinCosto).toBe(false);
    expect(r.margen).toBe(59);
    expect(r.porcentaje).toBe(100);
  });
});

describe("valorizarStock", () => {
  it("valoriza stock por costo promedio", () => {
    expect(valorizarStock({ stock: 12, costoPromedio: 32.5 })).toMatchObject({ unidades: 12, valor: 390, sinCosto: false });
  });

  it("avisa cuando hay stock sin costo en vez de valorizarlo en cero calladamente", () => {
    const r = valorizarStock({ stock: 12, costoPromedio: null });
    expect(r.valor).toBe(0);
    expect(r.sinCosto).toBe(true);
  });

  it("sin stock no hay nada que avisar", () => {
    expect(valorizarStock({ stock: 0, costoPromedio: null }).sinCosto).toBe(false);
  });

  it("un stock negativo no genera valor negativo", () => {
    expect(valorizarStock({ stock: -5, costoPromedio: 10 }).valor).toBe(0);
  });
});

describe("costoDeLineaRepartida", () => {
  it("promedia ponderando por unidades, no por partes iguales", () => {
    // 8 uds a 10 + 2 uds a 20 = 12, no 15.
    const r = costoDeLineaRepartida({
      movimientos: [{ id_sku: 1, cantidad: 8 }, { id_sku: 2, cantidad: 2 }],
      costoPorSku: new Map([[1, 10], [2, 20]]),
    });
    expect(r.costo).toBe(12);
    expect(r.completo).toBe(true);
  });

  it("una línea de un solo SKU devuelve su costo tal cual", () => {
    const r = costoDeLineaRepartida({
      movimientos: [{ id_sku: 7, cantidad: 3 }],
      costoPorSku: new Map([[7, 18.5]]),
    });
    expect(r.costo).toBe(18.5);
  });

  it("si UNA unidad no tiene costo, la línea entera queda sin costo", () => {
    // Promediar solo las que sí lo tienen afirmaría saber lo que no se sabe:
    // el número guardado se multiplica después por la cantidad completa.
    const r = costoDeLineaRepartida({
      movimientos: [{ id_sku: 1, cantidad: 5 }, { id_sku: 2, cantidad: 5 }],
      costoPorSku: new Map([[1, 20], [2, null]]),
    });
    expect(r.costo).toBeNull();
    expect(r.completo).toBe(false);
  });

  it("un SKU ausente del mapa no cuenta como costo cero", () => {
    const r = costoDeLineaRepartida({
      movimientos: [{ id_sku: 99, cantidad: 4 }],
      costoPorSku: new Map(),
    });
    expect(r.costo).toBeNull();
  });

  it("un costo en cero se trata como desconocido", () => {
    const r = costoDeLineaRepartida({
      movimientos: [{ id_sku: 1, cantidad: 4 }],
      costoPorSku: new Map([[1, 0]]),
    });
    expect(r.costo).toBeNull();
  });

  it("sin movimientos no inventa un costo", () => {
    expect(costoDeLineaRepartida({ movimientos: [], costoPorSku: new Map() }).costo).toBeNull();
    expect(costoDeLineaRepartida({ movimientos: undefined, costoPorSku: new Map() }).costo).toBeNull();
  });
});

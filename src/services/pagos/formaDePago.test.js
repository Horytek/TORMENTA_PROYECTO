import { describe, it, expect } from "vitest";
import {
  parsearFormaDePago,
  normalizarMetodo,
  totalEfectivo,
  cuadra,
  METODOS,
} from "./formaDePago.js";

/**
 * Los casos de este archivo salieron de `venta_boucher.formadepago` de la base
 * real, no de la imaginación: 304 "EFECTIVO", 10 "EFECTIVO, PLIN",
 * 3 "EFECTIVO:80.00" y varios "EFECTIVO:100.00|YAPE:20.00". El parser tiene que
 * poder migrar esas 373 filas sin perder plata por el camino.
 */

describe("normalizarMetodo", () => {
  it("reconoce los métodos que aparecen en los datos", () => {
    expect(normalizarMetodo("EFECTIVO")).toBe("EFECTIVO");
    expect(normalizarMetodo("YAPE")).toBe("YAPE");
    expect(normalizarMetodo("PLIN")).toBe("PLIN");
  });

  it("agrupa las marcas de tarjeta bajo TARJETA", () => {
    // En los datos hay "VISA"; mañana habrá Mastercard. Para cuadrar caja da
    // igual la marca: lo que importa es que no es efectivo.
    for (const v of ["VISA", "Mastercard", "débito", "POS"]) {
      expect(normalizarMetodo(v), v).toBe("TARJETA");
    }
  });

  it("tolera minúsculas, espacios y tildes", () => {
    expect(normalizarMetodo("  efectivo ")).toBe("EFECTIVO");
    expect(normalizarMetodo("crédito")).toBe("TARJETA");
  });

  it("lo desconocido cae en OTRO, no se descarta", () => {
    // Perder un pago es peor que clasificarlo mal: la caja no cuadraría.
    expect(normalizarMetodo("CANJE")).toBe("OTRO");
    expect(normalizarMetodo("xyz")).toBe("OTRO");
  });

  it("vacío es null (no hay pago que registrar)", () => {
    expect(normalizarMetodo("")).toBeNull();
    expect(normalizarMetodo(null)).toBeNull();
    expect(normalizarMetodo(undefined)).toBeNull();
  });
});

describe("parsearFormaDePago — los cuatro formatos reales", () => {
  it("método simple, sin monto", () => {
    const r = parsearFormaDePago("EFECTIVO");
    expect(r.pagos).toEqual([{ metodo: "EFECTIVO", monto: null }]);
    expect(r.montosInferidos).toBe(false);
  });

  it("método simple con el total conocido: el monto es exacto, no inferido a medias", () => {
    const r = parsearFormaDePago("EFECTIVO", 80);
    expect(r.pagos).toEqual([{ metodo: "EFECTIVO", monto: 80 }]);
    expect(cuadra(r.pagos, 80)).toBe(true);
  });

  it("método con monto embebido", () => {
    const r = parsearFormaDePago("EFECTIVO:80.00");
    expect(r.pagos).toEqual([{ metodo: "EFECTIVO", monto: 80 }]);
    expect(r.montosInferidos).toBe(false);
  });

  it("varios métodos separados por coma, sin montos", () => {
    const r = parsearFormaDePago("EFECTIVO, PLIN", 100);
    expect(r.pagos).toHaveLength(2);
    expect(r.montosInferidos).toBe(true); // se repartió: es un supuesto
    expect(cuadra(r.pagos, 100)).toBe(true);
  });

  it("pago mixto con montos por pipe — el caso que hace imposible cuadrar hoy", () => {
    const r = parsearFormaDePago("EFECTIVO:100.00|YAPE:20.00");
    expect(r.pagos).toEqual([
      { metodo: "EFECTIVO", monto: 100 },
      { metodo: "YAPE", monto: 20 },
    ]);
    expect(r.montosInferidos).toBe(false);
    expect(totalEfectivo(r.pagos)).toBe(100); // solo esto va al cajón
  });

  it("tres métodos a la vez", () => {
    const r = parsearFormaDePago("EFECTIVO, PLIN, YAPE", 90);
    expect(r.pagos.map((p) => p.metodo)).toEqual(["EFECTIVO", "PLIN", "YAPE"]);
    expect(cuadra(r.pagos, 90)).toBe(true);
  });
});

describe("parsearFormaDePago — reparto y redondeo", () => {
  it("el reparto cuadra exacto aunque no sea divisible", () => {
    // 100 / 3 = 33.333…: el último absorbe la diferencia para que sume 100.
    const r = parsearFormaDePago("EFECTIVO, YAPE, PLIN", 100);
    const suma = r.pagos.reduce((a, p) => a + p.monto, 0);
    expect(Math.round(suma * 100) / 100).toBe(100);
  });

  it("respeta los montos conocidos y reparte solo el resto", () => {
    const r = parsearFormaDePago("EFECTIVO:70.00|YAPE", 100);
    expect(r.pagos[0].monto).toBe(70);
    expect(r.pagos[1].monto).toBe(30);
  });

  it("sin total no inventa montos", () => {
    const r = parsearFormaDePago("EFECTIVO, YAPE");
    expect(r.pagos.every((p) => p.monto === null)).toBe(true);
    expect(r.montosInferidos).toBe(false);
  });

  it("marca cuándo los montos son supuestos", () => {
    // La UI debe poder distinguir un dato de una estimación.
    expect(parsearFormaDePago("EFECTIVO:100.00|YAPE:20.00").montosInferidos).toBe(false);
    expect(parsearFormaDePago("EFECTIVO, YAPE", 120).montosInferidos).toBe(true);
  });
});

describe("parsearFormaDePago — entradas rotas", () => {
  it("texto vacío o nulo no produce pagos", () => {
    for (const v of ["", "   ", null, undefined]) {
      expect(parsearFormaDePago(v).pagos, String(v)).toEqual([]);
    }
  });

  it("separadores sueltos no generan pagos fantasma", () => {
    expect(parsearFormaDePago("|,;").pagos).toEqual([]);
    expect(parsearFormaDePago("EFECTIVO,,PLIN").pagos).toHaveLength(2);
  });

  it("un monto ilegible queda en null en vez de cero", () => {
    // Un cero silencioso descuadraría la caja sin que nadie lo note.
    const r = parsearFormaDePago("EFECTIVO:abc");
    expect(r.pagos[0].monto).toBeNull();
  });

  it("la coma separa pagos, no decimales", () => {
    // En los datos reales los decimales van con punto ("EFECTIVO:80.00") y la
    // coma separa métodos ("EFECTIVO, PLIN"). Tratarla como decimal partiría
    // importes en pagos falsos.
    const r = parsearFormaDePago("EFECTIVO, PLIN");
    expect(r.pagos.map((p) => p.metodo)).toEqual(["EFECTIVO", "PLIN"]);
  });
});

describe("totalEfectivo", () => {
  it("suma solo lo que va al cajón", () => {
    const { pagos } = parsearFormaDePago("EFECTIVO:100.00|YAPE:20.00|PLIN:5.00");
    expect(totalEfectivo(pagos)).toBe(100);
  });

  it("una venta sin efectivo no aporta al cajón", () => {
    const { pagos } = parsearFormaDePago("YAPE:50.00");
    expect(totalEfectivo(pagos)).toBe(0);
  });

  it("tolera listas vacías o nulas", () => {
    expect(totalEfectivo([])).toBe(0);
    expect(totalEfectivo(null)).toBe(0);
  });

  it("solo EFECTIVO cuenta como efectivo en el catálogo", () => {
    const efectivos = Object.values(METODOS).filter((m) => m.efectivo).map((m) => m.codigo);
    expect(efectivos).toEqual(["EFECTIVO"]);
  });
});

describe("cuadra", () => {
  it("acepta diferencias de un céntimo por redondeo", () => {
    expect(cuadra([{ metodo: "EFECTIVO", monto: 99.99 }], 100)).toBe(true);
    expect(cuadra([{ metodo: "EFECTIVO", monto: 99 }], 100)).toBe(false);
  });

  it("sin total no puede afirmar que cuadra", () => {
    expect(cuadra([{ metodo: "EFECTIVO", monto: 50 }], null)).toBe(false);
  });
});

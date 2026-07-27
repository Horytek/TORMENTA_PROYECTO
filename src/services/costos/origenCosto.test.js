import { describe, it, expect } from "vitest";
import {
  ORIGEN,
  ORIGEN_POR_DEFECTO,
  normalizarOrigen,
  esOrigenValido,
  vocabularioDe,
  opcionesDeIngreso,
  requiereElegirOrigen,
  resolverOrigenDeLinea,
} from "./origenCosto.js";

/**
 * La configuración de la empresa fija el caso dominante, no el único. El caso
 * que estos tests protegen es el de la marca que fabrica su línea propia y
 * además compra accesorios: si el modo fuera excluyente, ese negocio no entra
 * en ninguna casilla.
 */

describe("normalizarOrigen", () => {
  it("acepta los tres orígenes", () => {
    expect(normalizarOrigen("ADQUIRIDOS")).toBe(ORIGEN.ADQUIRIDOS);
    expect(normalizarOrigen("PROPIOS")).toBe(ORIGEN.PROPIOS);
    expect(normalizarOrigen("MIXTO")).toBe(ORIGEN.MIXTO);
  });

  it("tolera minúsculas y espacios de los datos existentes", () => {
    expect(normalizarOrigen("  propios ")).toBe(ORIGEN.PROPIOS);
  });

  it("cae al defecto ante cualquier valor desconocido o vacío", () => {
    // Los tenants actuales tienen la columna en NULL: no deben quedar sin modo.
    for (const v of [null, undefined, "", "   ", "OTRO", 123]) {
      expect(normalizarOrigen(v), String(v)).toBe(ORIGEN_POR_DEFECTO);
    }
  });

  it("el defecto es comprar terminado, que es el caso más común", () => {
    expect(ORIGEN_POR_DEFECTO).toBe(ORIGEN.ADQUIRIDOS);
  });
});

describe("esOrigenValido", () => {
  it("distingue válido de defecto", () => {
    // normalizarOrigen nunca falla; esOrigenValido sí sirve para validar entradas.
    expect(esOrigenValido("PROPIOS")).toBe(true);
    expect(esOrigenValido("OTRO")).toBe(false);
    expect(esOrigenValido(null)).toBe(false);
  });
});

describe("vocabularioDe", () => {
  it("le pregunta a cada negocio en su idioma", () => {
    expect(vocabularioDe(ORIGEN.ADQUIRIDOS).campoCosto).toBe("Costo de compra");
    expect(vocabularioDe(ORIGEN.PROPIOS).campoCosto).toBe("Costo de producción");
    expect(vocabularioDe(ORIGEN.ADQUIRIDOS).nombreContraparte).toBe("Proveedor");
    expect(vocabularioDe(ORIGEN.PROPIOS).nombreContraparte).toBe("Taller");
  });

  it("nunca devuelve undefined, ni con basura", () => {
    expect(vocabularioDe(null).campoCosto).toBeTruthy();
    expect(vocabularioDe("XX").campoCosto).toBeTruthy();
  });
});

describe("opcionesDeIngreso y requiereElegirOrigen", () => {
  it("un negocio de caso único no ve el selector", () => {
    // Preguntar en cada línea algo que nunca cambia es fricción pura.
    for (const origen of [ORIGEN.ADQUIRIDOS, ORIGEN.PROPIOS]) {
      expect(requiereElegirOrigen(origen), origen).toBe(false);
      expect(opcionesDeIngreso(origen)).toHaveLength(1);
      expect(opcionesDeIngreso(origen)[0].valor).toBe(origen);
    }
  });

  it("un negocio mixto sí elige, y solo entre los dos reales", () => {
    expect(requiereElegirOrigen(ORIGEN.MIXTO)).toBe(true);
    const opciones = opcionesDeIngreso(ORIGEN.MIXTO);
    expect(opciones.map((o) => o.valor)).toEqual([ORIGEN.ADQUIRIDOS, ORIGEN.PROPIOS]);
    // MIXTO es un modo de empresa, no un origen que se pueda guardar en una línea.
    expect(opciones.map((o) => o.valor)).not.toContain(ORIGEN.MIXTO);
  });
});

describe("resolverOrigenDeLinea", () => {
  it("en empresa de caso único ignora lo que mande el cliente", () => {
    // Un negocio que declaró que solo compra no debería poder registrar
    // "PROPIOS" por un formulario manipulado o un front desactualizado.
    expect(resolverOrigenDeLinea(ORIGEN.ADQUIRIDOS, "PROPIOS")).toBe(ORIGEN.ADQUIRIDOS);
    expect(resolverOrigenDeLinea(ORIGEN.PROPIOS, "ADQUIRIDOS")).toBe(ORIGEN.PROPIOS);
  });

  it("en empresa mixta respeta lo elegido", () => {
    expect(resolverOrigenDeLinea(ORIGEN.MIXTO, "PROPIOS")).toBe(ORIGEN.PROPIOS);
    expect(resolverOrigenDeLinea(ORIGEN.MIXTO, "ADQUIRIDOS")).toBe(ORIGEN.ADQUIRIDOS);
  });

  it("en empresa mixta sin elección válida usa compra", () => {
    for (const v of [null, undefined, "", "MIXTO", "OTRO"]) {
      expect(resolverOrigenDeLinea(ORIGEN.MIXTO, v), String(v)).toBe(ORIGEN.ADQUIRIDOS);
    }
  });

  it("nunca guarda MIXTO en una línea", () => {
    for (const empresa of [ORIGEN.ADQUIRIDOS, ORIGEN.PROPIOS, ORIGEN.MIXTO, null]) {
      expect(resolverOrigenDeLinea(empresa, "MIXTO"), String(empresa)).not.toBe(ORIGEN.MIXTO);
    }
  });
});

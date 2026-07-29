import { describe, it, expect } from "vitest";
import {
  cantidadDisponible,
  devueltoPrevio,
  evaluarDevolucion,
  estadoInicial,
  puedeTransicionar,
  POLITICA_DEFAULT,
} from "./reglas.js";

/**
 * Estas reglas deciden si una devolución entra o no y a qué estado nace; si
 * fallan, el servidor podría aceptar una devolución fuera de plazo o
 * duplicar cantidades ya devueltas. Mismos casos borde que el frontend
 * (rules.test.ts) para que ambos lados rechacen exactamente lo mismo.
 */

describe("cantidadDisponible / devueltoPrevio", () => {
  it("resta lo ya devuelto en devoluciones que cuentan", () => {
    const previas = [
      { estado: "completada", items: [{ id_detalle: 1, cantidad: 2 }] },
      { estado: "rechazada", items: [{ id_detalle: 1, cantidad: 5 }] },
    ];
    expect(devueltoPrevio(1, previas)).toBe(2);
    expect(cantidadDisponible({ cantidad_vendida: 5, cantidad_devuelta_previa: 2 })).toBe(3);
  });
});

describe("evaluarDevolucion", () => {
  const item = (overrides = {}) => ({
    id_detalle: 1,
    id_producto: 10,
    descripcion: "Polo azul",
    cantidad_vendida: 3,
    cantidad_devuelta_previa: 0,
    cantidad: 1,
    precio_unitario: 50,
    importe: 50,
    motivo: "producto_defectuoso",
    condicion: "abierto",
    destino: "revision",
    ...overrides,
  });

  it("rechaza una venta fuera de plazo", () => {
    const haceUnAno = new Date();
    haceUnAno.setDate(haceUnAno.getDate() - 400);
    const ev = evaluarDevolucion({ fecha_venta: haceUnAno.toISOString(), items: [item()], politica: POLITICA_DEFAULT });
    expect(ev.permitida).toBe(false);
    expect(ev.errores.some((e) => e.includes("plazo máximo"))).toBe(true);
  });

  it("rechaza cantidad mayor a la disponible", () => {
    const ev = evaluarDevolucion({
      fecha_venta: new Date().toISOString(),
      items: [item({ cantidad: 5, cantidad_vendida: 3, cantidad_devuelta_previa: 0 })],
      politica: POLITICA_DEFAULT,
    });
    expect(ev.permitida).toBe(false);
    expect(ev.errores.some((e) => e.includes("unidades por devolver"))).toBe(true);
  });

  it("exige aprobación por encima del monto máximo", () => {
    const ev = evaluarDevolucion({
      fecha_venta: new Date().toISOString(),
      items: [item({ importe: 500, cantidad: 1, precio_unitario: 500 })],
      politica: POLITICA_DEFAULT,
    });
    expect(ev.permitida).toBe(true);
    expect(ev.requiere_aprobacion).toBe(true);
    expect(estadoInicial(ev)).toBe("pendiente_aprobacion");
  });

  it("nace en revisión cuando no requiere aprobación", () => {
    const ev = evaluarDevolucion({
      fecha_venta: new Date().toISOString(),
      items: [item()],
      politica: POLITICA_DEFAULT,
    });
    expect(estadoInicial(ev)).toBe("pendiente_revision");
  });
});

describe("puedeTransicionar", () => {
  it("permite las transiciones válidas de la máquina de estados", () => {
    expect(puedeTransicionar("pendiente_revision", "aprobada")).toBe(true);
    expect(puedeTransicionar("aprobada", "completada")).toBe(true);
  });

  it("rechaza transiciones inválidas o desde estados terminales", () => {
    expect(puedeTransicionar("rechazada", "aprobada")).toBe(false);
    expect(puedeTransicionar("completada", "pendiente_revision")).toBe(false);
    expect(puedeTransicionar("borrador", "completada")).toBe(false);
  });
});

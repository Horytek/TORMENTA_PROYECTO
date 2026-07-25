// ─────────────────────────────────────────────────────────────────
// Pruebas de las reglas de negocio de devoluciones (vitest, sin DOM).
// Cubren: parciales, múltiples devoluciones sobre una venta, límites de
// cantidad, no retornables, aprobación por monto, diferencia de cambio,
// destino de inventario y máquina de estados.
// ─────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import {
  cantidadDisponible,
  devueltoPrevio,
  diasDesde,
  diferenciaCambio,
  destinoSugerido,
  estadoInicial,
  evaluarDevolucion,
  importeItem,
  puedeTransicionar,
  totalDevolucion,
} from "./rules";
import { POLITICA_DEFAULT } from "../config/catalog";
import type { Devolucion, DevolucionItem } from "../types";

const politica = POLITICA_DEFAULT;

function item(partial: Partial<DevolucionItem> = {}): DevolucionItem {
  return {
    id_detalle: 1,
    id_producto: 100,
    descripcion: "Polo Oversize",
    cantidad_vendida: 3,
    cantidad_devuelta_previa: 0,
    cantidad: 1,
    precio_unitario: 50,
    importe: 50,
    motivo: "talla_incorrecta",
    condicion: "nuevo",
    destino: "stock_disponible",
    ...partial,
  };
}

function devolucion(items: DevolucionItem[], estado: Devolucion["estado"] = "completada"): Devolucion {
  return {
    id_devolucion: 1,
    codigo: "DEV-000001",
    id_venta: 10,
    canal: "tienda",
    fecha: new Date().toISOString(),
    estado,
    resolucion: "reembolso_efectivo",
    items,
    total: totalDevolucion(items),
  };
}

const hoy = new Date("2026-07-19");

describe("cantidades", () => {
  it("devolución parcial: disponible = vendida − devuelta previa", () => {
    expect(cantidadDisponible({ cantidad_vendida: 3, cantidad_devuelta_previa: 1 })).toBe(2);
  });

  it("nunca devuelve disponible negativo", () => {
    expect(cantidadDisponible({ cantidad_vendida: 1, cantidad_devuelta_previa: 5 })).toBe(0);
  });

  it("múltiples devoluciones sobre la misma venta acumulan lo devuelto", () => {
    const previas = [
      devolucion([item({ cantidad: 1 })]),
      devolucion([item({ cantidad: 1 })], "pendiente_revision"),
    ];
    expect(devueltoPrevio(1, previas)).toBe(2);
  });

  it("rechazadas, canceladas y borradores no cuentan como devuelto", () => {
    const previas = [
      devolucion([item({ cantidad: 2 })], "rechazada"),
      devolucion([item({ cantidad: 1 })], "cancelada"),
      devolucion([item({ cantidad: 1 })], "borrador"),
    ];
    expect(devueltoPrevio(1, previas)).toBe(0);
  });
});

describe("importes", () => {
  it("importe con descuento prorrateado", () => {
    expect(importeItem(2, 50, 10)).toBe(90);
  });

  it("total suma todos los items", () => {
    expect(totalDevolucion([item({ importe: 50 }), item({ importe: 30 })])).toBe(80);
  });

  it("cambio con diferencia a pagar por el cliente", () => {
    const i = item({
      importe: 50,
      producto_cambio: { id_producto: 200, descripcion: "Casaca", precio_unitario: 80, cantidad: 1 },
    });
    expect(diferenciaCambio([i])).toBe(30);
  });

  it("cambio con saldo a favor del cliente", () => {
    const i = item({
      importe: 50,
      producto_cambio: { id_producto: 201, descripcion: "Gorra", precio_unitario: 20, cantidad: 1 },
    });
    expect(diferenciaCambio([i])).toBe(-30);
  });
});

describe("política", () => {
  it("bloquea fuera del plazo máximo", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-01-01",
      items: [item()],
      politica,
      hoy,
    });
    expect(ev.permitida).toBe(false);
    expect(ev.errores.some((e) => e.includes("plazo"))).toBe(true);
  });

  it("bloquea productos no retornables", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item({ id_producto: 999 })],
      politica: { ...politica, productos_no_retornables: [999] },
      hoy,
    });
    expect(ev.permitida).toBe(false);
    expect(ev.errores.some((e) => e.includes("no retornable"))).toBe(true);
  });

  it("bloquea cantidades por encima del disponible", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item({ cantidad: 3, cantidad_devuelta_previa: 1 })],
      politica,
      hoy,
    });
    expect(ev.permitida).toBe(false);
  });

  it("exige aprobación cuando supera el límite de monto", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item({ importe: politica.monto_max_sin_aprobacion + 1 })],
      politica,
      hoy,
    });
    expect(ev.requiere_aprobacion).toBe(true);
    expect(estadoInicial(ev)).toBe("pendiente_aprobacion");
  });

  it("sin aprobación requerida arranca en revisión", () => {
    const ev = evaluarDevolucion({ fecha_venta: "2026-07-15", items: [item()], politica, hoy });
    expect(ev.permitida).toBe(true);
    expect(estadoInicial(ev)).toBe("pendiente_revision");
  });

  it("marca evidencia requerida según motivo", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item({ motivo: "producto_defectuoso" })],
      politica,
      hoy,
    });
    expect(ev.requiere_evidencia).toBe(true);
  });

  it("advierte si un producto no nuevo vuelve a stock disponible", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item({ condicion: "usado", destino: "stock_disponible" })],
      politica,
      hoy,
    });
    expect(ev.advertencias.length).toBeGreaterThan(0);
  });

  it("bloquea canales no permitidos", () => {
    const ev = evaluarDevolucion({
      fecha_venta: "2026-07-15",
      items: [item()],
      politica: { ...politica, canales_permitidos: ["tienda"] },
      canal: "ecommerce",
      hoy,
    });
    expect(ev.permitida).toBe(false);
  });

  it("diasDesde con fecha inválida bloquea (Infinity)", () => {
    expect(diasDesde("no-es-fecha", hoy)).toBe(Infinity);
  });
});

describe("destino de inventario", () => {
  it("condición nueva → stock disponible", () => {
    expect(destinoSugerido("nuevo", politica)).toBe("stock_disponible");
  });
  it("dañado → productos dañados; usado → revisión", () => {
    expect(destinoSugerido("danado", politica)).toBe("danados");
    expect(destinoSugerido("usado", politica)).toBe("revision");
  });
});

describe("máquina de estados", () => {
  it("transiciones válidas del flujo feliz", () => {
    expect(puedeTransicionar("pendiente_aprobacion", "aprobada")).toBe(true);
    expect(puedeTransicionar("aprobada", "procesando_reembolso")).toBe(true);
    expect(puedeTransicionar("procesando_reembolso", "completada")).toBe(true);
    expect(puedeTransicionar("completada", "cerrada")).toBe(true);
  });

  it("bloquea transiciones inválidas", () => {
    expect(puedeTransicionar("rechazada", "aprobada")).toBe(false);
    expect(puedeTransicionar("completada", "cancelada")).toBe(false);
    expect(puedeTransicionar("cerrada", "completada")).toBe(false);
  });
});

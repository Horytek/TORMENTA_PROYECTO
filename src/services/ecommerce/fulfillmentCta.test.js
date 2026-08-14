import { describe, expect, it } from "vitest";
import { buildDisponibilidad, DEFAULT_CONFIG } from "./DisponibilidadService.js";
import { badgeFromModo, resultadoStockLocal } from "./fulfillmentCta.js";

describe("resultadoStockLocal", () => {
  it("exige solicitud si hay stock local pero el producto tiene talla/color", () => {
    const dispLocal = buildDisponibilidad(12, {}, DEFAULT_CONFIG, { hasSeleccionAttrs: true });
    const result = resultadoStockLocal({ dispLocal, fulfillment: "pickup" });
    expect(dispLocal.cta.requiresSolicitud).toBe(true);
    expect(result.cta).toBe("solicitar");
    expect(result.modo).toBe("consultar");
    expect(result.disponibilidad.cta.showEnviarSolicitud).toBe(true);
    expect(result.disponibilidad.cta.allowAddToCart).toBe(false);
  });

  it("permite comprar si hay stock local y no exige confirmación", () => {
    const dispLocal = buildDisponibilidad(12, {}, DEFAULT_CONFIG, { hasSeleccionAttrs: false });
    const result = resultadoStockLocal({ dispLocal, fulfillment: "pickup" });
    expect(result.cta).toBe("comprar");
    expect(result.modo).toBe("inmediata");
    expect(result.label).toBe("Disponible para recoger");
  });

  it("usa label de delivery cuando no hay solicitud", () => {
    const dispLocal = buildDisponibilidad(8, {}, DEFAULT_CONFIG, { hasSeleccionAttrs: false });
    const result = resultadoStockLocal({ dispLocal, fulfillment: "delivery" });
    expect(result.label).toBe("Disponible para delivery");
  });
});

describe("badgeFromModo", () => {
  it("marca consultar como solicitud", () => {
    expect(badgeFromModo("consultar")).toBe("solicitud");
    expect(badgeFromModo("otra_ubicacion")).toBe("solicitud");
    expect(badgeFromModo("inmediata")).toBe("inmediata");
  });
});

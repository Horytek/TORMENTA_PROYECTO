import { describe, expect, it } from "vitest";
import {
  applyResolvedFulfillment,
  labelCtaPrincipal,
  resolveDisponibilidad,
} from "./disponibilidad";

const fallback = resolveDisponibilidad(10, {}, undefined, { hasSeleccionAttrs: true });

describe("applyResolvedFulfillment", () => {
  it("no pisa solicitud con Comprar ahora aunque el resolver mande cta comprar", () => {
    const merged = applyResolvedFulfillment(
      {
        cta: "comprar",
        label: "Disponible para recoger",
        hint: "Disponible para entrega inmediata",
        disponibilidad: fallback,
      },
      fallback
    );
    expect(merged?.cta.showEnviarSolicitud).toBe(true);
    expect(merged?.cta.allowAddToCart).toBe(false);
    expect(merged?.cta.primary).toBe("solicitud");
    expect(labelCtaPrincipal({ cta: "comprar", disponibilidad: fallback }, merged)).toBe(
      "Solicitar disponibilidad"
    );
  });

  it("mantiene comprar cuando el producto no exige solicitud", () => {
    const libre = resolveDisponibilidad(10, {}, undefined, { hasSeleccionAttrs: false });
    const merged = applyResolvedFulfillment(
      {
        cta: "comprar",
        label: "Disponible para recoger",
        disponibilidad: libre,
      },
      libre
    );
    expect(merged?.cta.allowAddToCart).toBe(true);
    expect(merged?.cta.showEnviarSolicitud).toBe(false);
    expect(labelCtaPrincipal({ cta: "comprar" }, merged)).toBe("Comprar ahora");
  });
});

import { describe, it, expect } from "vitest";
import { generarEan13 } from "./skuHelper.js";

describe("generarEan13", () => {
  it("genera 13 dígitos con prefijo 20 (rango GS1 de uso interno)", () => {
    const codigo = generarEan13(42);
    expect(codigo).toHaveLength(13);
    expect(codigo.startsWith("20")).toBe(true);
    expect(/^\d{13}$/.test(codigo)).toBe(true);
  });

  it("el dígito verificador es matemáticamente correcto (algoritmo EAN-13 real)", () => {
    // Verificación independiente del cálculo, no solo comparar contra la misma fórmula.
    const codigo = generarEan13(123456);
    const digitos = codigo.split("").map(Number);
    const verificador = digitos.pop();
    const suma = digitos.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    const esperado = (10 - (suma % 10)) % 10;
    expect(verificador).toBe(esperado);
  });

  it("id_sku distintos generan códigos distintos", () => {
    expect(generarEan13(1)).not.toBe(generarEan13(2));
  });

  it("es determinístico: el mismo id_sku siempre da el mismo código", () => {
    expect(generarEan13(999)).toBe(generarEan13(999));
  });

  it("rellena con ceros a la izquierda para id_sku chicos", () => {
    expect(generarEan13(7).slice(0, 12)).toBe("200000000007");
  });
});

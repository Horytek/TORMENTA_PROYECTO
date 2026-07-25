import { describe, it, expect } from "vitest";
import { numeroALetras } from "./numeroALetras.js";

/**
 * La leyenda 1000 va impresa en el comprobante y SUNAT la exige. Un error acá
 * no rompe nada visible: emite un documento válido con el monto mal escrito.
 * Por eso los casos son los irregulares del español, que es donde se falla.
 */
describe("numeroALetras", () => {
  it("escribe el monto en palabras, no el número (el bug del flujo legacy)", () => {
    // El legacy emitía "SON 118.00 CON 00/100 SOLES" — el dígito, no la palabra.
    const resultado = numeroALetras(118);
    expect(resultado).toBe("CIENTO DIECIOCHO CON 00/100 SOLES");
    expect(resultado).not.toMatch(/\d+\.\d{2}/);
  });

  it("respeta los céntimos reales en vez de fijar 00/100", () => {
    // El legacy siempre ponía "00/100" aunque la venta tuviera céntimos.
    expect(numeroALetras(1234.56)).toBe("MIL DOSCIENTOS TREINTA Y CUATRO CON 56/100 SOLES");
    expect(numeroALetras(0.5)).toBe("CERO CON 50/100 SOLES");
    expect(numeroALetras(99.99)).toBe("NOVENTA Y NUEVE CON 99/100 SOLES");
  });

  describe("irregulares del español", () => {
    it("distingue CIEN de CIENTO", () => {
      expect(numeroALetras(100)).toMatch(/^CIEN CON/);
      expect(numeroALetras(101)).toMatch(/^CIENTO UNO CON/);
      expect(numeroALetras(200)).toMatch(/^DOSCIENTOS CON/);
    });

    it("usa las centenas irregulares (no 'cincocientos')", () => {
      expect(numeroALetras(500)).toMatch(/^QUINIENTOS CON/);
      expect(numeroALetras(700)).toMatch(/^SETECIENTOS CON/);
      expect(numeroALetras(900)).toMatch(/^NOVECIENTOS CON/);
    });

    it("dice MIL, nunca 'UN MIL'", () => {
      expect(numeroALetras(1000)).toMatch(/^MIL CON/);
      expect(numeroALetras(1000)).not.toMatch(/UN MIL/);
      expect(numeroALetras(2000)).toMatch(/^DOS MIL CON/);
    });

    it("apocopa UNO delante de MIL y MILLONES", () => {
      expect(numeroALetras(21000)).toMatch(/^VEINTIÚN MIL CON/);
      expect(numeroALetras(31000)).toMatch(/^TREINTA Y UN MIL CON/);
      expect(numeroALetras(1_000_000)).toMatch(/^UN MILLÓN CON/);
      expect(numeroALetras(2_000_000)).toMatch(/^DOS MILLONES CON/);
    });

    it("escribe los veinti- pegados y los treinta y ... separados", () => {
      expect(numeroALetras(21)).toMatch(/^VEINTIUNO CON/);
      expect(numeroALetras(26)).toMatch(/^VEINTISÉIS CON/);
      expect(numeroALetras(31)).toMatch(/^TREINTA Y UNO CON/);
      expect(numeroALetras(45)).toMatch(/^CUARENTA Y CINCO CON/);
    });
  });

  describe("redondeo a céntimos", () => {
    it("redondea antes de partir entero y céntimos", () => {
      // Sin redondear primero, 0.999 daría "CERO CON 99/100" en vez de "UNO CON 00/100".
      expect(numeroALetras(0.999)).toBe("UNO CON 00/100 SOLES");
      expect(numeroALetras(1.005)).toBe("UNO CON 01/100 SOLES");
    });

    it("no arrastra el error binario de los flotantes", () => {
      // 0.1 + 0.2 === 0.30000000000000004
      expect(numeroALetras(0.1 + 0.2)).toBe("CERO CON 30/100 SOLES");
    });
  });

  describe("monedas", () => {
    it("nombra las monedas del catálogo", () => {
      expect(numeroALetras(10, "PEN")).toMatch(/SOLES$/);
      expect(numeroALetras(10, "USD")).toMatch(/DÓLARES AMERICANOS$/);
      expect(numeroALetras(10, "EUR")).toMatch(/EUROS$/);
    });

    it("usa el código tal cual si la moneda no está mapeada", () => {
      expect(numeroALetras(10, "CLP")).toMatch(/CLP$/);
    });
  });

  describe("entradas inválidas", () => {
    it("rechaza montos no numéricos o negativos en vez de emitir basura", () => {
      // Preferimos fallar antes de firmar que declarar un monto absurdo.
      expect(() => numeroALetras("abc")).toThrow(/monto inválido/i);
      expect(() => numeroALetras(-1)).toThrow(/monto inválido/i);
      expect(() => numeroALetras(NaN)).toThrow(/monto inválido/i);
      expect(() => numeroALetras(Infinity)).toThrow(/monto inválido/i);
    });

    it("acepta cero", () => {
      expect(numeroALetras(0)).toBe("CERO CON 00/100 SOLES");
    });
  });
});

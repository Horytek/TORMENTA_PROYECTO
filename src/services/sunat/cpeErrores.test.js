import { describe, it, expect } from "vitest";
import { categorizarErrorSunat, ErrorCpe, CATEGORIAS, CATEGORIAS_REINTENTABLES } from "./cpeErrores.js";

/**
 * La categoría del error decide si se reintenta. Equivocarse acá no da un
 * mensaje feo: duplica un comprobante ante SUNAT, o deja uno bueno sin emitir.
 */
describe("categorizarErrorSunat", () => {
  it("respeta la categoría que ya trae un ErrorCpe", () => {
    const error = new ErrorCpe("CPE_CLIENTE_INVALIDO", "falta RUC", { categoria: CATEGORIAS.VALIDACION });
    expect(categorizarErrorSunat(error)).toBe(CATEGORIAS.VALIDACION);
  });

  describe("un timeout DESPUÉS de enviar nunca es un fallo limpio", () => {
    // Es la regla que impide duplicar: la petición salió, SUNAT pudo recibirla.
    it("un corte de red antes de enviar es RED (reintentable)", () => {
      expect(categorizarErrorSunat(new Error("socket hang up"), { yaSeEnvio: false })).toBe(CATEGORIAS.RED);
      expect(CATEGORIAS_REINTENTABLES.has(CATEGORIAS.RED)).toBe(true);
    });

    it("el MISMO error después de enviar es INCIERTO (no reintentable)", () => {
      expect(categorizarErrorSunat(new Error("socket hang up"), { yaSeEnvio: true })).toBe(CATEGORIAS.INCIERTO);
      expect(CATEGORIAS_REINTENTABLES.has(CATEGORIAS.INCIERTO)).toBe(false);
    });

    it("un error desconocido después de enviar también es INCIERTO", () => {
      expect(categorizarErrorSunat(new Error("vaya usted a saber"), { yaSeEnvio: true })).toBe(CATEGORIAS.INCIERTO);
      expect(categorizarErrorSunat(new Error("vaya usted a saber"), { yaSeEnvio: false })).toBe(CATEGORIAS.DESCONOCIDO);
    });
  });

  it("reconoce los errores de red por su código", () => {
    for (const codigo of ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "EPIPE"]) {
      expect(categorizarErrorSunat(new Error(`request failed ${codigo}`)), codigo).toBe(CATEGORIAS.RED);
    }
  });

  it("un código SUNAT de rechazo en el mensaje no se reintenta", () => {
    expect(categorizarErrorSunat(new Error("Error 2335: el importe total no coincide"))).toBe(CATEGORIAS.RECHAZO);
    expect(CATEGORIAS_REINTENTABLES.has(CATEGORIAS.RECHAZO)).toBe(false);
  });

  it("un código de fallo del sistema de SUNAT sí se reintenta", () => {
    expect(categorizarErrorSunat(new Error("Error 1032: no se pudo procesar"))).toBe(CATEGORIAS.SUNAT_SISTEMA);
    expect(CATEGORIAS_REINTENTABLES.has(CATEGORIAS.SUNAT_SISTEMA)).toBe(true);
  });

  it("el rechazo de SUNAT gana sobre la pista de red del mismo mensaje", () => {
    // Un 2335 es del documento aunque el transporte también se haya quejado.
    expect(categorizarErrorSunat(new Error("2335 rechazado, luego ECONNRESET"))).toBe(CATEGORIAS.RECHAZO);
  });

  it("tolera errores sin message (el cliente SOAP lanza objetos pelados)", () => {
    expect(categorizarErrorSunat({})).toBe(CATEGORIAS.DESCONOCIDO);
    expect(categorizarErrorSunat(null)).toBe(CATEGORIAS.DESCONOCIDO);
    expect(categorizarErrorSunat(undefined, { yaSeEnvio: true })).toBe(CATEGORIAS.INCIERTO);
  });

  it("ninguna categoría no reintentable entra al conjunto de reintentos", () => {
    for (const categoria of [CATEGORIAS.CONFIG, CATEGORIAS.VALIDACION, CATEGORIAS.RECHAZO, CATEGORIAS.INCIERTO]) {
      expect(CATEGORIAS_REINTENTABLES.has(categoria), categoria).toBe(false);
    }
  });
});

describe("ErrorCpe", () => {
  it("lleva código y categoría para que el controller traduzca el status HTTP", () => {
    const error = new ErrorCpe("CPE_EN_PROCESO", "ya se está enviando", { categoria: CATEGORIAS.INCIERTO });
    expect(error).toBeInstanceOf(Error);
    expect(error.codigo).toBe("CPE_EN_PROCESO");
    expect(error.categoria).toBe(CATEGORIAS.INCIERTO);
    expect(error.message).toBe("ya se está enviando");
  });

  it("cae en DESCONOCIDO si no se declara categoría", () => {
    expect(new ErrorCpe("X", "y").categoria).toBe(CATEGORIAS.DESCONOCIDO);
  });
});

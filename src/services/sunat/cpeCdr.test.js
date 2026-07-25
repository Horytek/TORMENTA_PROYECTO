import { describe, it, expect } from "vitest";
import { parseCdrSummary, clasificarResponseCode, ESTADOS_CPE } from "./cpeCdr.js";

/**
 * El CDR es la única fuente de verdad sobre si un comprobante fue aceptado.
 * El flujo legacy no lo miraba —tomaba cualquier HTTP 200 por éxito—, así que
 * un rechazo quedaba registrado como aceptado. Estos tests fijan esa frontera.
 */

const cdr = ({ code = "0", description = "aceptada", notes = [] } = {}) => `<?xml version="1.0"?>
<ar:ApplicationResponse xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>R-20610588981-03-B001-00000901</cbc:ID>
  <cac:DocumentResponse><cac:Response>
    <cbc:ResponseCode>${code}</cbc:ResponseCode>
    <cbc:Description>${description}</cbc:Description>
    ${notes.map((n) => `<cbc:Note>${n}</cbc:Note>`).join("\n    ")}
  </cac:Response></cac:DocumentResponse>
</ar:ApplicationResponse>`;

describe("parseCdrSummary", () => {
  it("extrae código, descripción y observaciones", () => {
    const resumen = parseCdrSummary(
      cdr({ code: "0", description: "La Boleta numero B001-00000901, ha sido aceptada", notes: ["4267 El dato ingresado en el precio unitario no cumple con el formato establecido"] })
    );
    expect(resumen.responseCode).toBe("0");
    expect(resumen.description).toBe("La Boleta numero B001-00000901, ha sido aceptada");
    expect(resumen.notes).toHaveLength(1);
    expect(resumen.notes[0]).toMatch(/^4267/);
  });

  it("devuelve lista vacía de notas cuando no hay observaciones", () => {
    expect(parseCdrSummary(cdr()).notes).toEqual([]);
  });

  it("recorta espacios y saltos de línea de la descripción", () => {
    const resumen = parseCdrSummary(cdr({ description: "\n      aceptada\n    " }));
    expect(resumen.description).toBe("aceptada");
  });

  it("devuelve null si no hay CDR (envío fallido) en vez de reventar", () => {
    expect(parseCdrSummary(null)).toBeNull();
    expect(parseCdrSummary("")).toBeNull();
  });

  it("no inventa un código cuando el XML no lo trae", () => {
    expect(parseCdrSummary("<xml>sin nada</xml>").responseCode).toBeNull();
  });
});

describe("clasificarResponseCode", () => {
  it("código 0 sin notas es ACEPTADO", () => {
    const r = clasificarResponseCode("0");
    expect(r.estado).toBe(ESTADOS_CPE.ACEPTADO);
    expect(r.reintentable).toBe(false);
  });

  it("código 0 CON notas es aceptado pero con observaciones", () => {
    // Sigue siendo válido ante SUNAT, pero hay reparos que corregir.
    const r = clasificarResponseCode("0", ["4267 formato de precio unitario"]);
    expect(r.estado).toBe(ESTADOS_CPE.ACEPTADO_CON_OBS);
    expect(r.reintentable).toBe(false);
  });

  it("2000-3999 es RECHAZO y NUNCA se reintenta", () => {
    // El error es del documento: reenviar el mismo XML da el mismo rechazo.
    for (const codigo of ["2000", "2335", "3999"]) {
      const r = clasificarResponseCode(codigo);
      expect(r.estado, `código ${codigo}`).toBe(ESTADOS_CPE.RECHAZADO);
      expect(r.reintentable, `código ${codigo}`).toBe(false);
    }
  });

  it("0100-1999 es fallo del sistema de SUNAT y sí se reintenta", () => {
    // El comprobante puede no haberse procesado: reintentar es seguro.
    for (const codigo of ["100", "1032", "1999"]) {
      const r = clasificarResponseCode(codigo);
      expect(r.estado, `código ${codigo}`).toBe(ESTADOS_CPE.INCIERTO);
      expect(r.categoria, `código ${codigo}`).toBe("SUNAT_SISTEMA");
      expect(r.reintentable, `código ${codigo}`).toBe(true);
    }
  });

  it("sin código legible queda INCIERTO y no se reintenta solo", () => {
    // No se puede afirmar nada: reenviar a ciegas podría duplicar el comprobante.
    for (const entrada of [null, undefined, "", "abc"]) {
      const r = clasificarResponseCode(entrada);
      expect(r.estado).toBe(ESTADOS_CPE.INCIERTO);
      expect(r.reintentable).toBe(false);
    }
  });

  it("acepta el código como número o como string", () => {
    expect(clasificarResponseCode(2335).estado).toBe(ESTADOS_CPE.RECHAZADO);
    expect(clasificarResponseCode("2335").estado).toBe(ESTADOS_CPE.RECHAZADO);
  });

  it("ningún rechazo se clasifica como aceptado", () => {
    // La invariante que el flujo legacy violaba.
    for (let codigo = 2000; codigo <= 3999; codigo += 137) {
      const r = clasificarResponseCode(String(codigo));
      expect(r.estado, `código ${codigo}`).not.toBe(ESTADOS_CPE.ACEPTADO);
      expect(r.estado, `código ${codigo}`).not.toBe(ESTADOS_CPE.ACEPTADO_CON_OBS);
    }
  });
});

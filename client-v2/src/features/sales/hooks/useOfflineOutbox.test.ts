import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { esRechazoDelServidor } from "./useOfflineOutbox";

/**
 * De esta clasificación depende que la cola offline no se atasque.
 *
 * Si un rechazo del servidor se confunde con falta de conexión, esa venta se
 * reintenta para siempre y —peor— frena a todas las que vengan detrás, que
 * nunca llegan al backend. El caso real es 409 sin stock: dos cajas vendieron
 * offline la última prenda y solo una puede ganar.
 */

const conStatus = (status: number) =>
  new AxiosError("fallo", "ERR", undefined, undefined, {
    status,
    data: {},
    statusText: "",
    headers: {},
    config: { headers: {} },
  } as never);

describe("esRechazoDelServidor", () => {
  it("409 sin stock es rechazo: reintentar da siempre lo mismo", () => {
    expect(esRechazoDelServidor(conStatus(409))).toBe(true);
  });

  it("400 y 422 de validación también son rechazo", () => {
    expect(esRechazoDelServidor(conStatus(400))).toBe(true);
    expect(esRechazoDelServidor(conStatus(422))).toBe(true);
  });

  it("401 y 403 son rechazo: la sesión o el permiso no se arreglan reintentando", () => {
    expect(esRechazoDelServidor(conStatus(401))).toBe(true);
    expect(esRechazoDelServidor(conStatus(403))).toBe(true);
  });

  it("500 NO es rechazo: el servidor se cayó y puede volver", () => {
    expect(esRechazoDelServidor(conStatus(500))).toBe(false);
    expect(esRechazoDelServidor(conStatus(503))).toBe(false);
  });

  it("sin respuesta es problema de red: se reintenta", () => {
    // Es el caso normal offline: la petición nunca llegó a destino.
    expect(esRechazoDelServidor(new AxiosError("Network Error"))).toBe(false);
  });

  it("un error que no es de axios se trata como reintentable", () => {
    // Ante la duda, reintentar: perder una venta es peor que reenviarla, y el
    // backend deduplica por idempotency_key de todas formas.
    expect(esRechazoDelServidor(new Error("boom"))).toBe(false);
    expect(esRechazoDelServidor(null)).toBe(false);
    expect(esRechazoDelServidor(undefined)).toBe(false);
  });
});

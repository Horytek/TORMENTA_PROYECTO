import { describe, it, expect } from "vitest";
import { tokenVigente, expiracionDelToken, esFalloDeRed } from "./sesionOffline";

/**
 * De estas dos decisiones depende que la caja abra o no sin internet, y que
 * no abra cuando no debe. Confundir "no llegué a preguntar" con "me dijeron
 * que no" deja al POS fuera justo cuando más se lo necesita; confundirlo al
 * revés mantendría abierta una sesión que el servidor ya rechazó.
 */

const tokenCon = (carga: Record<string, unknown>) =>
  `x.${btoa(JSON.stringify(carga))}.y`;

describe("tokenVigente", () => {
  const ahora = 1_700_000_000_000;

  it("acepta un token cuya expiración aún no llegó", () => {
    expect(tokenVigente(tokenCon({ exp: ahora / 1000 + 3600 }), ahora)).toBe(true);
  });

  it("rechaza un token expirado: sin señal no se estira la sesión", () => {
    expect(tokenVigente(tokenCon({ exp: ahora / 1000 - 1 }), ahora)).toBe(false);
  });

  it("rechaza lo que no puede leer, en vez de asumir que sirve", () => {
    expect(tokenVigente("no-es-un-jwt", ahora)).toBe(false);
    expect(tokenVigente(tokenCon({ sub: 1 }), ahora)).toBe(false); // sin exp
    expect(tokenVigente(undefined, ahora)).toBe(false);
    expect(tokenVigente(null, ahora)).toBe(false);
    expect(tokenVigente("", ahora)).toBe(false);
  });

  it("expiracionDelToken devuelve milisegundos, no segundos", () => {
    expect(expiracionDelToken(tokenCon({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });
});

describe("esFalloDeRed", () => {
  it("sin respuesta del servidor es fallo de red: se puede seguir offline", () => {
    expect(esFalloDeRed({ code: "ERR_NETWORK" })).toBe(true);
    expect(esFalloDeRed(new Error("Network Error"))).toBe(true);
  });

  it("con respuesta NO es fallo de red: el servidor decidió", () => {
    // Un 401 tiene que cerrar la sesión aunque el usuario esté sin señal después.
    expect(esFalloDeRed({ response: { status: 401 } })).toBe(false);
    expect(esFalloDeRed({ response: { status: 403 } })).toBe(false);
    expect(esFalloDeRed({ response: { status: 500 } })).toBe(false);
  });

  it("no revienta con nulos", () => {
    expect(esFalloDeRed(null)).toBe(false);
    expect(esFalloDeRed(undefined)).toBe(false);
  });
});

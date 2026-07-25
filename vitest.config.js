import { defineConfig } from "vitest/config";

/**
 * Tests del BACKEND. `client-v2` tiene su propia configuración de vitest, así
 * que acá se acota a `src/` para que `npm test` en la raíz no intente correr
 * los tests del frontend (ni al revés).
 *
 * Regla de la casa: en `src/` solo se testean módulos PUROS — los que deciden
 * algo sin tocar BD ni red. Lo que necesita MySQL o SUNAT se verifica contra el
 * entorno local, no acá; si un test necesita una conexión, es señal de que la
 * lógica debería salir a un módulo aparte.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
    exclude: ["**/node_modules/**", "client/**", "client-v2/**"],
    environment: "node",
  },
});

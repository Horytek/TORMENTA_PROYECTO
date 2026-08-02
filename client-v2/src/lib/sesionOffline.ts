/**
 * Última sesión válida, guardada para poder abrir el POS sin conexión.
 *
 * `App.tsx` verifica el token contra el servidor al arrancar y, si la llamada
 * falla, limpia la sesión y manda al login. Un fallo de red es indistinguible
 * de un 401 en ese `catch`, así que sin internet la caja quedaba fuera —
 * y con ella el service worker, la cola de ventas y la foto del catálogo:
 * todo el andamiaje offline sin ninguna pantalla donde usarse.
 *
 * Guardar la respuesta buena permite rehidratar la sesión cuando el servidor
 * no contesta. NO es un bypass de seguridad: el token sigue siendo el mismo
 * JWT firmado, se comprueba que no haya expirado, y cualquier operación real
 * contra el backend lo revalida. Solo evita cerrar sesión por estar sin señal.
 */

const CLAVE = "horytek.sesion.offline";

export interface SesionGuardada {
  usuario: unknown;
  capabilities: string[];
  guardado_en: number;
}

/** `exp` del JWT en milisegundos, o null si no se puede leer. */
export function expiracionDelToken(token: string | undefined | null): number | null {
  if (!token) return null;
  try {
    const carga = JSON.parse(atob(token.split(".")[1]));
    return typeof carga?.exp === "number" ? carga.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * ¿El token sigue vigente según su propia fecha de expiración?
 * Sin `exp` legible se responde que no: preferimos mandar al login antes que
 * abrir la caja con una credencial que no sabemos leer.
 */
export function tokenVigente(token: string | undefined | null, ahora = Date.now()): boolean {
  const exp = expiracionDelToken(token);
  return exp !== null && exp > ahora;
}

export function guardarSesion(usuario: unknown, capabilities: string[]): void {
  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify({ usuario, capabilities, guardado_en: Date.now() } satisfies SesionGuardada)
    );
  } catch {
    /* sin sesión offline; no es motivo para romper el login normal */
  }
}

export function leerSesion(): SesionGuardada | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const s = JSON.parse(crudo) as SesionGuardada;
    return s?.usuario ? s : null;
  } catch {
    return null;
  }
}

export function olvidarSesion(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que hacer */
  }
}

/** Un error sin respuesta del servidor: no llegamos, no es que nos rechazaran. */
export function esFalloDeRed(error: unknown): boolean {
  const e = error as { response?: unknown; code?: string } | undefined;
  if (!e) return false;
  if (e.response) return false; // el servidor contestó: 401/403 son decisiones suyas
  return true;
}

import type { POSProduct } from "@/features/sales/types";

/**
 * Fotos de los datos que el POS necesita para poder vender sin conexión.
 *
 * El service worker cachea el shell de la app pero excluye `/api/` a propósito
 * (ver `public/sw.js`), así que sin esto la caja abre offline con la lista de
 * productos vacía y el selector de almacén colgado en "Cargando…": se puede
 * encolar una venta, pero no hay forma de armar el carrito.
 *
 * Se guarda una foto por almacén —el stock depende de cuál esté elegido— y
 * con su fecha, para poder decirle a la cajera qué tan vieja es la
 * información con la que está vendiendo.
 */

const DB_NAME = "horytek-catalogo";
const DB_VERSION = 1;
const STORE = "catalogo_pos";

interface Foto<T> {
  clave: string;
  datos: T;
  guardado_en: number;
}

export interface FotoCatalogo {
  productos: POSProduct[];
  guardado_en: number;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "clave" });
      }
    };
    req.onsuccess = () => {
      // Si la base existe pero sin el store (versión a medio crear), es
      // preferible descartarla que quedar sin foto para siempre.
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.close();
        const borrar = indexedDB.deleteDatabase(DB_NAME);
        borrar.onsuccess = () => abrirDb().then(resolve, reject);
        borrar.onerror = () => reject(borrar.error);
        return;
      }
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

async function guardar<T>(clave: string, datos: T): Promise<void> {
  try {
    const db = await abrirDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ clave, datos, guardado_en: Date.now() } satisfies Foto<T>);
        // Se espera al commit, no al `onsuccess` del put: hasta que la
        // transacción no cierra, el dato no es durable.
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    /* sin foto offline; no es motivo para romper la caja */
  }
}

async function leer<T>(clave: string): Promise<Foto<T> | null> {
  try {
    const db = await abrirDb();
    try {
      return await new Promise<Foto<T> | null>((resolve, reject) => {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).get(clave);
        req.onsuccess = () => resolve((req.result as Foto<T>) ?? null);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

/** Sin almacén elegido, el backend devuelve el consolidado. */
const claveCatalogo = (id_almacen?: number | null): string =>
  `catalogo:${id_almacen == null ? "todos" : id_almacen}`;

export const guardarCatalogo = (
  id_almacen: number | null | undefined,
  productos: POSProduct[]
): Promise<void> =>
  // No pisar una foto útil con una lista vacía.
  productos?.length ? guardar(claveCatalogo(id_almacen), productos) : Promise.resolve();

export async function leerCatalogo(
  id_almacen: number | null | undefined
): Promise<FotoCatalogo | null> {
  const foto = await leer<POSProduct[]>(claveCatalogo(id_almacen));
  return foto ? { productos: foto.datos, guardado_en: foto.guardado_en } : null;
}

/**
 * Lista de almacenes del selector del POS. Sin ella, `selectedAlmacenId` nunca
 * se resuelve y la pantalla se queda en "Cargando almacén…" sin llegar nunca
 * a pedir el catálogo.
 */
export const guardarAlmacenes = <T,>(almacenes: T[]): Promise<void> =>
  almacenes?.length ? guardar("almacenes", almacenes) : Promise.resolve();

export async function leerAlmacenes<T>(): Promise<T[] | null> {
  const foto = await leer<T[]>("almacenes");
  return foto?.datos ?? null;
}

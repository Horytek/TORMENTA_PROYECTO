/**
 * Cola local (IndexedDB) de ventas que no se pudieron enviar al backend por
 * falta de conexión. Cada entrada usa `idempotency_key` como key — el mismo
 * valor que ya viaja en el payload de `POST /ventas/agregar_venta` y que el
 * backend deduplica (ver `buscarVentaPorIdempotencia` en `ventas.controller.js`),
 * así que reintentar un envío encolado nunca duplica la venta.
 */

const DB_NAME = "horytek-outbox";
const DB_VERSION = 1;
const STORE = "ventas_pendientes";

export interface VentaPendiente {
  idempotency_key: string;
  payload: unknown;
  creado_en: number;
  intentos: number;
  ultimo_error?: string;
  /**
   * El servidor respondió y rechazó la venta (4xx): no es un problema de
   * conexión y reintentarla dará siempre el mismo error. Queda apartada para
   * que alguien la resuelva a mano, y sobre todo para que NO bloquee al resto
   * de la cola. El caso típico es 409 sin stock: dos cajas vendieron offline
   * la última prenda y solo una puede ganar.
   */
  rechazada?: boolean;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "idempotency_key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function conStore<T>(modo: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrirDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, modo);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export const encolarVenta = (payload: unknown, idempotency_key: string): Promise<void> =>
  conStore("readwrite", (store) =>
    store.put({ idempotency_key, payload, creado_en: Date.now(), intentos: 0 } satisfies VentaPendiente)
  ).then(() => undefined);

export const listarVentasPendientes = (): Promise<VentaPendiente[]> =>
  conStore("readonly", (store) => store.getAll());

export const eliminarVentaPendiente = (idempotency_key: string): Promise<void> =>
  conStore("readwrite", (store) => store.delete(idempotency_key)).then(() => undefined);

async function actualizarPendiente(
  idempotency_key: string,
  cambios: (item: VentaPendiente) => VentaPendiente
): Promise<void> {
  const db = await abrirDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(idempotency_key);
      getReq.onsuccess = () => {
        const item = getReq.result as VentaPendiente | undefined;
        if (item) store.put(cambios(item));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Falló por conexión: se reintentará sola en el próximo drenado. */
export const registrarIntentoFallido = (idempotency_key: string, error: string): Promise<void> =>
  actualizarPendiente(idempotency_key, (item) => ({
    ...item,
    intentos: item.intentos + 1,
    ultimo_error: error,
  }));

/** El servidor la rechazó: se aparta para revisión y deja de reintentarse. */
export const marcarRechazada = (idempotency_key: string, error: string): Promise<void> =>
  actualizarPendiente(idempotency_key, (item) => ({
    ...item,
    intentos: item.intentos + 1,
    ultimo_error: error,
    rechazada: true,
  }));

/** Descarta una venta rechazada que el usuario ya resolvió (o decidió perder). */
export const descartarVentaRechazada = eliminarVentaPendiente;

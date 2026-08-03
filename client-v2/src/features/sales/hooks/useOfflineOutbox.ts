import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  listarVentasPendientes,
  eliminarVentaPendiente,
  registrarIntentoFallido,
  marcarRechazada,
  descartarVentaRechazada,
  type VentaPendiente,
} from "@/lib/offlineOutbox";
import { createVenta } from "../api/ventas";
import type { VentaPayload } from "../types";

// Módulo compartido entre instancias del hook: evita drenar la cola dos
// veces en paralelo si hay más de un componente montado (badge + modal).
let sincronizando = false;

/**
 * ¿El servidor contestó y dijo que no?
 *
 * Si hay `response`, la petición llegó y el backend la rechazó: reintentarla
 * dará siempre lo mismo. Sin `response` (o con 5xx) es red o servidor caído, y
 * ahí sí corresponde reintentar. El 409 por stock insuficiente es el caso real
 * más frecuente: dos cajas vendieron offline la última prenda.
 */
export const esRechazoDelServidor = (err: unknown): boolean => {
  if (!(err instanceof AxiosError)) return false;
  const status = err.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
};

const mensajeDe = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return err instanceof Error ? err.message : String(err);
};

/** Cola de ventas pendientes por enviar (guardadas offline) + drenado automático al reconectar. */
export function useOfflineOutbox() {
  const [items, setItems] = useState<VentaPendiente[]>([]);

  const refrescar = useCallback(async () => {
    setItems(await listarVentasPendientes());
  }, []);

  const sincronizar = useCallback(async () => {
    if (sincronizando || !navigator.onLine) return;
    sincronizando = true;
    try {
      const cola = (await listarVentasPendientes())
        .filter((v) => !v.rechazada) // una rechazada no se reintenta ni frena al resto
        .sort((a, b) => a.creado_en - b.creado_en);

      for (const item of cola) {
        try {
          await createVenta(item.payload as VentaPayload);
          await eliminarVentaPendiente(item.idempotency_key);
        } catch (err) {
          if (esRechazoDelServidor(err)) {
            // Se aparta y se SIGUE con la cola: antes un solo rechazo (409 sin
            // stock, por ejemplo) quedaba encolado para siempre y bloqueaba
            // todas las ventas posteriores, que nunca llegaban al servidor.
            await marcarRechazada(item.idempotency_key, mensajeDe(err));
            continue;
          }
          await registrarIntentoFallido(item.idempotency_key, mensajeDe(err));
          break; // sin conexión: no tiene sentido insistir con el resto ahora
        }
      }
    } finally {
      sincronizando = false;
      await refrescar();
    }
  }, [refrescar]);

  const descartar = useCallback(
    async (idempotency_key: string) => {
      await descartarVentaRechazada(idempotency_key);
      await refrescar();
    },
    [refrescar]
  );

  // La UI necesita separarlas: una espera conexión, la otra espera a una persona.
  const pendientes = useMemo(() => items.filter((v) => !v.rechazada), [items]);
  const rechazadas = useMemo(() => items.filter((v) => v.rechazada), [items]);

  useEffect(() => {
    refrescar();
    sincronizar();
    window.addEventListener("online", sincronizar);
    const intervalo = setInterval(() => sincronizar(), 30000);
    return () => {
      window.removeEventListener("online", sincronizar);
      clearInterval(intervalo);
    };
  }, [refrescar, sincronizar]);

  return { pendientes, rechazadas, sincronizar, descartar };
}

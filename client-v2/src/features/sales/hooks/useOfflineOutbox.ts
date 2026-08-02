import { useCallback, useEffect, useState } from "react";
import {
  listarVentasPendientes,
  eliminarVentaPendiente,
  registrarIntentoFallido,
  type VentaPendiente,
} from "@/lib/offlineOutbox";
import { createVenta } from "../api/ventas";
import type { VentaPayload } from "../types";

// Módulo compartido entre instancias del hook: evita drenar la cola dos
// veces en paralelo si hay más de un componente montado (badge + modal).
let sincronizando = false;

/** Cola de ventas pendientes por enviar (guardadas offline) + drenado automático al reconectar. */
export function useOfflineOutbox() {
  const [pendientes, setPendientes] = useState<VentaPendiente[]>([]);

  const refrescar = useCallback(async () => {
    setPendientes(await listarVentasPendientes());
  }, []);

  const sincronizar = useCallback(async () => {
    if (sincronizando || !navigator.onLine) return;
    sincronizando = true;
    try {
      const cola = (await listarVentasPendientes()).sort((a, b) => a.creado_en - b.creado_en);
      for (const item of cola) {
        try {
          await createVenta(item.payload as VentaPayload);
          await eliminarVentaPendiente(item.idempotency_key);
        } catch (err) {
          await registrarIntentoFallido(item.idempotency_key, err instanceof Error ? err.message : String(err));
          break; // probablemente seguimos sin conexión: no insistir con el resto ahora
        }
      }
    } finally {
      sincronizando = false;
      await refrescar();
    }
  }, [refrescar]);

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

  return { pendientes, sincronizar };
}

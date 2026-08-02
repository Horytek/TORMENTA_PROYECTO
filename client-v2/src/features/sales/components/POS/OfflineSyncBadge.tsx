import { WifiOff, RefreshCw, TriangleAlert, X } from "lucide-react";
import { useOfflineOutbox } from "../../hooks/useOfflineOutbox";

/**
 * Estado de las ventas guardadas sin conexión.
 *
 * Son dos situaciones distintas y confundirlas deja a la cajera esperando algo
 * que no va a pasar:
 *  - pendiente  → falta conexión; se enviará sola al reconectar.
 *  - rechazada  → el servidor la respondió que no (típicamente 409 sin stock,
 *                 porque otra caja vendió la misma prenda). Reintentar no
 *                 sirve: necesita que una persona decida.
 */
export function OfflineSyncBadge() {
  const { pendientes, rechazadas, sincronizar, descartar } = useOfflineOutbox();
  if (pendientes.length === 0 && rechazadas.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {pendientes.length > 0 && (
        <button
          type="button"
          onClick={() => sincronizar()}
          title="Ventas guardadas en este dispositivo, pendientes de enviar. Clic para reintentar ahora."
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 h-8 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
        >
          <WifiOff className="h-3.5 w-3.5" />
          {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"}
          <RefreshCw className="h-3 w-3" />
        </button>
      )}

      {rechazadas.length > 0 && (
        <div
          title={
            `El servidor rechazó ${rechazadas.length === 1 ? "esta venta" : "estas ventas"}: ` +
            rechazadas.map((v) => v.ultimo_error ?? "sin detalle").join(" · ") +
            ". Reintentar no ayuda; revisa el stock y vuelve a cobrarla si corresponde."
          }
          className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 h-8 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400"
        >
          <TriangleAlert className="h-3.5 w-3.5" />
          {rechazadas.length} rechazada{rechazadas.length === 1 ? "" : "s"}
          <button
            type="button"
            onClick={() => rechazadas.forEach((v) => descartar(v.idempotency_key))}
            title="Descartar las ventas rechazadas de este dispositivo"
            className="ml-0.5 rounded p-0.5 hover:bg-rose-200/60 dark:hover:bg-rose-900/60"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

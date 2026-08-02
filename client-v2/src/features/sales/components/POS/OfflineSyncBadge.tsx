import { WifiOff, RefreshCw } from "lucide-react";
import { useOfflineOutbox } from "../../hooks/useOfflineOutbox";

/** Indicador de ventas guardadas sin conexión, pendientes de enviar a SUNAT/backend. */
export function OfflineSyncBadge() {
  const { pendientes, sincronizar } = useOfflineOutbox();
  if (pendientes.length === 0) return null;

  return (
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
  );
}

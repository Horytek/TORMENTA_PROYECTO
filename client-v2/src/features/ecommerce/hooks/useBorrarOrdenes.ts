import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ecommerceDeleteOrdenes } from "../api/ecommerce";

type OrdenRef = { id_orden: number; codigo?: string };

export function useBorrarOrdenes(
  invalidateKeys: unknown[][],
  onDeleted?: (ids: number[]) => void
) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmIds, setConfirmIds] = useState<number[] | null>(null);
  const [confirmCodigos, setConfirmCodigos] = useState<string[]>([]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = (ids: number[]) => {
    const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));
    if (allOn) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelected((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const askDelete = (items: OrdenRef[]) => {
    if (!items.length) return;
    setConfirmIds(items.map((o) => o.id_orden));
    setConfirmCodigos(items.map((o) => o.codigo || `#${o.id_orden}`));
  };

  const closeConfirm = () => setConfirmIds(null);

  const mut = useMutation({
    mutationFn: (ids: number[]) => ecommerceDeleteOrdenes(ids),
    onSuccess: (_res, ids) => {
      toast.success(ids.length === 1 ? "Pedido borrado" : `${ids.length} pedidos borrados`);
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      setConfirmIds(null);
      onDeleted?.(ids);
      for (const queryKey of invalidateKeys) {
        qc.invalidateQueries({ queryKey });
      }
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "No se pudieron borrar los pedidos");
    },
  });

  const n = confirmIds?.length ?? 0;
  const dialog = {
    open: confirmIds != null && confirmIds.length > 0,
    title: n === 1 ? "¿Borrar este pedido?" : `¿Borrar ${n} pedidos?`,
    description:
      n === 1
        ? `Se va a borrar el pedido ${confirmCodigos[0]}. Esta acción no se puede deshacer.`
        : `Se van a borrar ${n} pedidos (${confirmCodigos.slice(0, 4).join(", ")}${
            n > 4 ? "…" : ""
          }). Esta acción no se puede deshacer.`,
    confirm: () => confirmIds && mut.mutate(confirmIds),
  };

  return { selected, toggle, toggleAll, askDelete, closeConfirm, mut, dialog };
}

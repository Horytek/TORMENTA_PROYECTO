// ─────────────────────────────────────────────────────────────────
// Hooks de datos del módulo de devoluciones (TanStack Query).
// Separan las páginas/componentes de la capa API.
// ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cambiarEstadoDevolucion,
  createDevolucion,
  getDevolucion,
  getDevoluciones,
  getDevolucionesByVenta,
  procesarReembolso,
} from "../api/devoluciones";
import type { DevolucionEstado, DevolucionFilters, DevolucionPayload } from "../types";

const KEY = "devoluciones";

export function useDevoluciones(filters?: DevolucionFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => getDevoluciones(filters),
    retry: false,
  });
}

export function useDevolucion(id: number | null) {
  return useQuery({
    queryKey: [KEY, "detalle", id],
    queryFn: () => getDevolucion(id as number),
    enabled: id != null,
    retry: false,
  });
}

/** Devoluciones previas de una venta — para calcular cantidades aún devolvibles.
 *  Si el endpoint falla se trata como lista vacía: el backend valida de nuevo al crear. */
export function useDevolucionesPrevias(idVenta: number | null) {
  return useQuery({
    queryKey: [KEY, "por_venta", idVenta],
    queryFn: async () => {
      try {
        return await getDevolucionesByVenta(idVenta as number);
      } catch {
        return [];
      }
    },
    enabled: idVenta != null,
    retry: false,
  });
}

export function useCrearDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DevolucionPayload) => createDevolucion(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(`Devolución ${res.codigo ?? ""} registrada`.trim());
    },
    onError: () => toast.error("No se pudo registrar la devolución"),
  });
}

export function useCambiarEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, nota }: { id: number; estado: DevolucionEstado; nota?: string }) =>
      cambiarEstadoDevolucion(id, { estado, nota }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("No se pudo cambiar el estado"),
  });
}

export function useProcesarReembolso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, metodo }: { id: number; metodo: string }) => procesarReembolso(id, { metodo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Reembolso procesado");
    },
    onError: () => toast.error("No se pudo procesar el reembolso"),
  });
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ArrowRight, CheckCircle2, XCircle, PackageCheck, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGuidedTransfers, dispatchTransfer, receiveTransfer, cancelTransfer } from "../api/inventoryMovements";
import type { GuidedTransfer } from "../types";
import { TransferDialog } from "./TransferDialog";

export const GuidedTransfersPanel = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("");

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["guided-transfers", filterEstado],
    queryFn: () => getGuidedTransfers({ estado: filterEstado || undefined }),
  });

  const dispatchMut = useMutation({
    mutationFn: (t: GuidedTransfer) => {
      const items = (t.detalles || []).map((d) => ({
        id_sku: d.id_sku,
        cantidad_despachada: d.cantidad_solicitada,
      }));
      return dispatchTransfer(t.id_transferencia, items);
    },
    onSuccess: () => {
      toast.success("Transferencia despachada. Stock descontado del origen.");
      queryClient.invalidateQueries({ queryKey: ["guided-transfers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al despachar");
    },
  });

  const receiveMut = useMutation({
    mutationFn: (t: GuidedTransfer) => {
      const items = (t.detalles || []).map((d) => ({
        id_sku: d.id_sku,
        cantidad_recibida: d.cantidad_despachada > 0 ? d.cantidad_despachada : d.cantidad_solicitada,
      }));
      return receiveTransfer(t.id_transferencia, items);
    },
    onSuccess: () => {
      toast.success("Transferencia recibida. Stock ingresado al destino.");
      queryClient.invalidateQueries({ queryKey: ["guided-transfers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al recibir");
    },
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelTransfer(id),
    onSuccess: () => {
      toast.success("Transferencia cancelada.");
      queryClient.invalidateQueries({ queryKey: ["guided-transfers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al cancelar");
    },
  });

  const getBadge = (estado: string) => {
    switch (estado) {
      case "SOLICITADA":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Solicitada</Badge>;
      case "DESPACHADA":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Tránsito</Badge>;
      case "RECIBIDA":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Recibida</Badge>;
      case "CANCELADA":
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterEstado === "" ? "default" : "outline"}
            onClick={() => setFilterEstado("")}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={filterEstado === "SOLICITADA" ? "default" : "outline"}
            onClick={() => setFilterEstado("SOLICITADA")}
          >
            Solicitadas
          </Button>
          <Button
            size="sm"
            variant={filterEstado === "DESPACHADA" ? "default" : "outline"}
            onClick={() => setFilterEstado("DESPACHADA")}
          >
            En Tránsito
          </Button>
          <Button
            size="sm"
            variant={filterEstado === "RECIBIDA" ? "default" : "outline"}
            onClick={() => setFilterEstado("RECIBIDA")}
          >
            Recibidas
          </Button>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
          <Plus className="w-4 h-4" /> Nueva Solicitud de Transferencia
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="border border-dashed rounded-lg py-12 text-center text-gray-500 bg-white">
          <PackageCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-sm">No hay transferencias guiadas registradas</p>
          <p className="text-xs text-gray-400 mt-1">Crea una solicitud para transferir stock entre almacenes.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="divide-y">
            {transfers.map((t) => (
              <div key={t.id_transferencia} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-900 text-sm">{t.codigo_transferencia}</span>
                    {getBadge(t.estado)}
                    <span className="text-xs text-gray-500">
                      {new Date(t.f_solicitud).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.estado === "SOLICITADA" && (
                      <Button
                        size="sm"
                        onClick={() => dispatchMut.mutate(t)}
                        disabled={dispatchMut.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Despachar
                      </Button>
                    )}

                    {t.estado === "DESPACHADA" && (
                      <Button
                        size="sm"
                        onClick={() => receiveMut.mutate(t)}
                        disabled={receiveMut.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recepcionar
                      </Button>
                    )}

                    {(t.estado === "SOLICITADA" || t.estado === "DESPACHADA") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelMut.mutate(t.id_transferencia)}
                        disabled={cancelMut.isPending}
                        className="text-red-600 hover:bg-red-50 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-md">
                  <span className="font-medium text-gray-900">{t.almacen_origen || `Almacén #${t.id_almacen_origen}`}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-900">{t.almacen_destino || `Almacén #${t.id_almacen_destino}`}</span>
                  {t.glosa && <span className="text-gray-400 ml-2">| {t.glosa}</span>}
                </div>

                {t.detalles && t.detalles.length > 0 && (
                  <div className="border rounded-md overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100/70 text-gray-600">
                        <tr>
                          <th className="p-2 font-medium">Producto</th>
                          <th className="p-2 font-medium text-center">Cant. Solicitada</th>
                          <th className="p-2 font-medium text-center">Cant. Despachada</th>
                          <th className="p-2 font-medium text-center">Cant. Recibida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {t.detalles.map((d) => (
                          <tr key={d.id_detalle}>
                            <td className="p-2">
                              <span className="font-medium">{d.nom_producto}</span>{" "}
                              <span className="text-gray-400">({d.sku})</span>
                            </td>
                            <td className="p-2 text-center font-mono font-medium">{d.cantidad_solicitada}</td>
                            <td className="p-2 text-center font-mono text-blue-700">{d.cantidad_despachada || "—"}</td>
                            <td className="p-2 text-center font-mono text-emerald-700">{d.cantidad_recibida || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <TransferDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};

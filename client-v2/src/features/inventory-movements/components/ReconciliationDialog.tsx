import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Scale, Zap } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReconciliationMatrix, applyInventoryAdjustment } from "../api/inventoryMovements";
import type { BlindCountSession } from "../types";

interface ReconciliationDialogProps {
  session: BlindCountSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReconciliationDialog = ({ session, isOpen, onClose }: ReconciliationDialogProps) => {
  const queryClient = useQueryClient();

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ["reconciliation-matrix", session?.id_inventario_fisico],
    queryFn: () => getReconciliationMatrix(session!.id_inventario_fisico),
    enabled: !!session && isOpen,
  });

  const applyMutation = useMutation({
    mutationFn: () => applyInventoryAdjustment(session!.id_inventario_fisico),
    onSuccess: () => {
      toast.success("¡Ajuste de inventario aplicado exitosamente en 1 clic!");
      queryClient.invalidateQueries({ queryKey: ["blind-count-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-matrix", session?.id_inventario_fisico] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al aplicar el ajuste de stock");
    },
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span>Matriz de Reconciliación ({session?.codigo_conteo})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Cards */}
          {matrixData?.resumen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase">Total SKUs Auditoría</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{matrixData.resumen.total_items}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-emerald-700 uppercase">Sobrantes (Ingreso)</p>
                <p className="text-xl font-bold text-emerald-900 mt-0.5">+{matrixData.resumen.sobrantes_count}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-rose-700 uppercase">Faltantes (Salida)</p>
                <p className="text-xl font-bold text-rose-900 mt-0.5">-{matrixData.resumen.faltantes_count}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-indigo-700 uppercase">Impacto Valorizado</p>
                <p
                  className={`text-xl font-bold mt-0.5 ${
                    matrixData.resumen.valor_total_diferencia < 0
                      ? "text-rose-600"
                      : matrixData.resumen.valor_total_diferencia > 0
                      ? "text-emerald-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(matrixData.resumen.valor_total_diferencia)}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2.5 font-semibold text-gray-700">SKU / Producto</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-center">Stock Sistema</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-center">Conteo Físico</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-center">Diferencia</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-right">Costo Unit.</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-right">Valor Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matrixData?.detalles.map((item) => {
                    const dif = item.diferencia ?? 0;
                    return (
                      <tr key={item.id_sku} className="hover:bg-gray-50/80">
                        <td className="p-2.5">
                          <p className="font-medium text-gray-900">{item.nom_producto}</p>
                          <p className="text-gray-500 text-[11px]">{item.sku}</p>
                        </td>
                        <td className="p-2.5 text-center font-mono font-medium">{item.stock_sistema_snapshot}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-indigo-700">
                          {item.cantidad_contada ?? "—"}
                        </td>
                        <td className="p-2.5 text-center">
                          {dif === 0 ? (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700">
                              0 (Sin cambio)
                            </Badge>
                          ) : dif > 0 ? (
                            <Badge className="bg-emerald-500 text-white font-mono">+{dif} Sobrante</Badge>
                          ) : (
                            <Badge className="bg-rose-500 text-white font-mono">{dif} Faltante</Badge>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-600">
                          {formatCurrency(Number(item.costo_unitario_snapshot))}
                        </td>
                        <td
                          className={`p-2.5 text-right font-mono font-bold ${
                            item.valor_diferencia < 0
                              ? "text-rose-600"
                              : item.valor_diferencia > 0
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formatCurrency(item.valor_diferencia)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Al aplicar, se crearán automáticamente las notas de ajuste de almacén.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {session?.estado !== "APLICADO" && (
              <Button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending || session?.estado !== "CONTEO_COMPLETADO"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {applyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                Aplicar Ajuste de Stock 1-Clic
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

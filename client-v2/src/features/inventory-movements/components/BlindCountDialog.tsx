import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReconciliationMatrix, saveBlindCountItems } from "../api/inventoryMovements";
import type { BlindCountSession } from "../types";

interface BlindCountDialogProps {
  session: BlindCountSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BlindCountDialog = ({ session, isOpen, onClose }: BlindCountDialogProps) => {
  const queryClient = useQueryClient();
  const [countInputs, setCountInputs] = useState<Record<number, number>>({});

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ["reconciliation-matrix", session?.id_inventario_fisico],
    queryFn: () => getReconciliationMatrix(session!.id_inventario_fisico),
    enabled: !!session && isOpen,
  });

  useEffect(() => {
    if (matrixData?.detalles) {
      const initial: Record<number, number> = {};
      matrixData.detalles.forEach((d) => {
        initial[d.id_sku] = d.cantidad_contada ?? 0;
      });
      setCountInputs(initial);
    }
  }, [matrixData]);

  const saveMutation = useMutation({
    mutationFn: (conteos: Array<{ id_sku: number; cantidad_contada: number }>) =>
      saveBlindCountItems(session!.id_inventario_fisico, conteos),
    onSuccess: () => {
      toast.success("Conteo físico guardado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["blind-count-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-matrix", session?.id_inventario_fisico] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al guardar el conteo");
    },
  });

  const handleInputChange = (id_sku: number, value: string) => {
    const parsed = parseInt(value, 10);
    setCountInputs((prev) => ({
      ...prev,
      [id_sku]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const handleSubmit = () => {
    if (!matrixData?.detalles) return;
    const payload = matrixData.detalles.map((d) => ({
      id_sku: d.id_sku,
      cantidad_contada: countInputs[d.id_sku] ?? 0,
    }));
    saveMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-indigo-600" />
            <span>Ingreso de Conteo Físico Ciego ({session?.codigo_conteo})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between text-xs text-indigo-950">
            <div>
              <p className="font-semibold">{session?.titulo}</p>
              <p className="text-indigo-700">Almacén: {session?.nom_almacen || `#${session?.id_almacen}`}</p>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-800 font-medium">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Stock del sistema oculto para el auditor</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2.5 font-semibold text-gray-700">Producto / SKU</th>
                    <th className="p-2.5 font-semibold text-gray-700">Cód. Barras</th>
                    <th className="p-2.5 font-semibold text-gray-700 text-right">Cantidad Contada</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matrixData?.detalles.map((item) => (
                    <tr key={item.id_sku} className="hover:bg-gray-50/80">
                      <td className="p-2.5">
                        <p className="font-medium text-gray-900">{item.nom_producto}</p>
                        <p className="text-gray-500 text-[11px]">{item.sku}</p>
                      </td>
                      <td className="p-2.5 font-mono text-gray-600">{item.cod_barras || "—"}</td>
                      <td className="p-2.5 text-right">
                        <Input
                          type="number"
                          min="0"
                          value={countInputs[item.id_sku] ?? 0}
                          onChange={(e) => handleInputChange(item.id_sku, e.target.value)}
                          className="w-24 ml-auto text-center font-bold text-gray-900 border-indigo-200 focus:border-indigo-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Guardar Conteo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

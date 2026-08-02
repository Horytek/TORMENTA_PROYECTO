import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAlmacenesSalida } from "@/features/warehouse-notes/api/warehouseNotes";
import api from "@/api/axios";
import { createTransferRequest } from "../api/inventoryMovements";

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedSkuItem {
  id_sku: number;
  sku: string;
  nom_producto: string;
  cantidad: number;
}

export const TransferDialog = ({ isOpen, onClose }: TransferDialogProps) => {
  const queryClient = useQueryClient();
  const [almacenOrigen, setAlmacenOrigen] = useState<string>("");
  const [almacenDestino, setAlmacenDestino] = useState<string>("");
  const [glosa, setGlosa] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<SelectedSkuItem[]>([]);

  // SKU search state
  const [skuQuery, setSkuQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id_sku: number; sku: string; nom_producto: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes-transfer"],
    queryFn: getAlmacenesSalida,
  });

  const handleSearchSku = async () => {
    if (!skuQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/productos?q=${encodeURIComponent(skuQuery)}`);
      const prods = res.data?.data || res.data || [];
      const flatSkus: Array<{ id_sku: number; sku: string; nom_producto: string }> = [];
      for (const p of prods) {
        if (p.skus && Array.isArray(p.skus)) {
          p.skus.forEach((s: any) => {
            flatSkus.push({
              id_sku: s.id_sku,
              sku: s.sku || p.cod_producto || `SKU-${s.id_sku}`,
              nom_producto: `${p.nom_producto} (${s.sku || ""})`,
            });
          });
        } else if (p.id_sku) {
          flatSkus.push({
            id_sku: p.id_sku,
            sku: p.cod_producto || p.sku || `SKU-${p.id_sku}`,
            nom_producto: p.nom_producto,
          });
        }
      }
      setSearchResults(flatSkus);
    } catch {
      toast.error("Error al buscar productos");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = (skuItem: { id_sku: number; sku: string; nom_producto: string }) => {
    if (items.some((i) => i.id_sku === skuItem.id_sku)) {
      toast.error("El ítem ya está agregado");
      return;
    }
    setItems((prev) => [...prev, { ...skuItem, cantidad: 1 }]);
    setSearchResults([]);
    setSkuQuery("");
  };

  const handleRemoveItem = (id_sku: number) => {
    setItems((prev) => prev.filter((i) => i.id_sku !== id_sku));
  };

  const handleQuantityChange = (id_sku: number, cant: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id_sku === id_sku ? { ...i, cantidad: Math.max(1, cant) } : i))
    );
  };

  const createMutation = useMutation({
    mutationFn: createTransferRequest,
    onSuccess: () => {
      toast.success("Solicitud de transferencia creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["guided-transfers"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al crear la solicitud");
    },
  });

  const handleSubmit = () => {
    if (!almacenOrigen || !almacenDestino) {
      toast.error("Seleccione almacén de origen y destino");
      return;
    }
    if (almacenOrigen === almacenDestino) {
      toast.error("Los almacenes deben ser distintos");
      return;
    }
    if (items.length === 0) {
      toast.error("Agregue al menos un producto a la transferencia");
      return;
    }

    createMutation.mutate({
      id_almacen_origen: Number(almacenOrigen),
      id_almacen_destino: Number(almacenDestino),
      glosa: glosa || "TRANSFERENCIA ENTRE ALMACENES",
      observaciones,
      items: items.map((i) => ({
        id_sku: i.id_sku,
        cantidad_solicitada: i.cantidad,
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Nueva Solicitud de Transferencia</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Almacén Origen</label>
              <Select value={almacenOrigen} onValueChange={setAlmacenOrigen}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar origen..." />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((a: any) => (
                    <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                      {a.nom_almacen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Almacén Destino</label>
              <Select value={almacenDestino} onValueChange={setAlmacenDestino}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar destino..." />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((a: any) => (
                    <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                      {a.nom_almacen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Glosa / Motivo</label>
            <Input
              value={glosa}
              onChange={(e) => setGlosa(e.target.value)}
              placeholder="Ej. Reabastecimiento de tienda central"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Observaciones</label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional..."
              className="mt-1 h-16 text-xs"
            />
          </div>

          {/* Sku Search */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2">
            <label className="text-xs font-semibold text-gray-700">Buscar y Agregar Productos (SKU)</label>
            <div className="flex gap-2">
              <Input
                value={skuQuery}
                onChange={(e) => setSkuQuery(e.target.value)}
                placeholder="Nombre o código SKU..."
                onKeyDown={(e) => e.key === "Enter" && handleSearchSku()}
              />
              <Button type="button" variant="secondary" onClick={handleSearchSku} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded bg-white divide-y">
                {searchResults.map((res) => (
                  <div
                    key={res.id_sku}
                    className="p-2 text-xs hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => handleAddItem(res)}
                  >
                    <span>{res.nom_producto}</span>
                    <Button size="xs" variant="ghost">
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Productos a Transferir ({items.length})</label>
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center border border-dashed rounded-md">
                No has agregado ningún producto todavía.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden divide-y text-xs">
                {items.map((item) => (
                  <div key={item.id_sku} className="p-2.5 flex items-center justify-between bg-white gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.nom_producto}</p>
                      <p className="text-gray-500 text-[11px]">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-[11px]">Cant:</span>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(item.id_sku, parseInt(e.target.value) || 1)}
                        className="w-20 h-8 text-xs text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveItem(item.id_sku)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Emitir Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

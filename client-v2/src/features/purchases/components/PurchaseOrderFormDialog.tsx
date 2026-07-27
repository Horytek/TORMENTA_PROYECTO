import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/FormField";
import { getProveedores } from "@/features/suppliers/api/suppliers";
import { getAlmacenesIngreso } from "@/features/warehouse-notes/api/warehouseNotes";

import { PurchaseProductPicker } from "./PurchaseProductPicker";
import { createPurchaseOrder } from "../api/purchases";
import type { PurchaseOrderFormItem } from "../types";

interface HeaderValues {
  id_destinatario: string;
  id_almacen: string;
  fecha: string;
  glosa: string;
  observacion: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyHeader: HeaderValues = {
  id_destinatario: "",
  id_almacen: "",
  fecha: todayISO(),
  glosa: "",
  observacion: "",
};

interface PurchaseOrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseOrderFormDialog({ isOpen, onClose }: PurchaseOrderFormDialogProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<PurchaseOrderFormItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { control, register, handleSubmit, watch, reset } = useForm<HeaderValues>({ defaultValues: emptyHeader });

  useEffect(() => {
    if (isOpen) {
      reset(emptyHeader);
      setItems([]);
      setError(null);
    }
  }, [isOpen, reset]);

  const { data: proveedores = [] } = useQuery({
    queryKey: ["compras-proveedores"],
    queryFn: getProveedores,
    enabled: isOpen,
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ["compras-almacenes"],
    queryFn: getAlmacenesIngreso,
    enabled: isOpen,
  });

  const addItem = (item: PurchaseOrderFormItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.uniqueKey === item.uniqueKey);
      if (existing) {
        return prev.map((p) => (p.uniqueKey === item.uniqueKey ? { ...p, cantidad: p.cantidad + item.cantidad } : p));
      }
      return [...prev, item];
    });
  };

  const removeItem = (uniqueKey: string) => setItems((prev) => prev.filter((p) => p.uniqueKey !== uniqueKey));

  const total = items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0);

  const mutation = useMutation({
    mutationFn: (values: HeaderValues) =>
      createPurchaseOrder({
        id_destinatario: values.id_destinatario,
        id_almacen: values.id_almacen,
        fecha: values.fecha,
        glosa: values.glosa,
        observacion: values.observacion,
        items: items.map((i) => ({
          id_producto: i.id_producto,
          id_tonalidad: i.id_tonalidad,
          id_talla: i.id_talla,
          id_sku: i.id_sku,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
      }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.message || "El servidor rechazó la orden de compra. Verifica los datos e intenta de nuevo.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
    onError: () => setError("No se pudo crear la orden de compra. Intenta de nuevo."),
  });

  const isValid = !!watch("id_destinatario") && !!watch("id_almacen") && !!watch("fecha") && items.length > 0;

  const onSubmit = (values: HeaderValues) => {
    setError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva orden de compra</DialogTitle>
          <DialogDescription>Registra el compromiso con el proveedor antes de recibir la mercadería.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Proveedor">
              <Controller
                control={control}
                name="id_destinatario"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.destinatario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Almacén destino">
              <Controller
                control={control}
                name="id_almacen"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un almacén" /></SelectTrigger>
                    <SelectContent>
                      {almacenes.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.almacen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Fecha" htmlFor="fecha">
              <Input id="fecha" type="date" {...register("fecha", { required: true })} />
            </FormField>

            <FormField label="Concepto (glosa)" htmlFor="glosa" optional>
              <Input id="glosa" placeholder="Ej. Reposición de temporada…" {...register("glosa")} />
            </FormField>
          </div>

          <FormField label="Observaciones" htmlFor="observacion" optional>
            <Textarea id="observacion" rows={2} {...register("observacion")} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <PackageSearch className="h-4 w-4" /> Productos
            </div>
            <PurchaseProductPicker onAdd={addItem} />

            {items.length > 0 && (
              <div className="rounded-xl border border-border">
                {items.map((item) => (
                  <div
                    key={item.uniqueKey}
                    className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.marca} · {item.cantidad} × S/ {item.precio_unitario.toFixed(2)} = S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.uniqueKey)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-end gap-2 px-3 py-2 text-sm font-semibold text-foreground">
                  Total: S/ {total.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar orden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

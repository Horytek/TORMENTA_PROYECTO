import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { createPurchaseInvoice } from "../api/purchases";

interface FormValues {
  id_destinatario: string;
  num_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyValues: FormValues = {
  id_destinatario: "",
  num_factura: "",
  fecha_emision: todayISO(),
  fecha_vencimiento: todayISO(),
  monto_total: "",
};

interface PurchaseInvoiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseInvoiceFormDialog({ isOpen, onClose }: PurchaseInvoiceFormDialogProps) {
  const queryClient = useQueryClient();
  const { control, register, handleSubmit, watch, reset } = useForm<FormValues>({ defaultValues: emptyValues });

  useEffect(() => {
    if (isOpen) reset(emptyValues);
  }, [isOpen, reset]);

  const { data: proveedores = [] } = useQuery({
    queryKey: ["compras-proveedores"],
    queryFn: getProveedores,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createPurchaseInvoice({
        id_destinatario: values.id_destinatario,
        num_factura: values.num_factura.trim(),
        fecha_emision: values.fecha_emision,
        fecha_vencimiento: values.fecha_vencimiento,
        monto_total: Number(values.monto_total),
      }),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
      onClose();
    },
  });

  const isValid =
    !!watch("id_destinatario") && !!watch("num_factura") && !!watch("fecha_emision") &&
    !!watch("fecha_vencimiento") && Number(watch("monto_total")) > 0;

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar factura de compra</DialogTitle>
          <DialogDescription>Genera automáticamente la cuenta por pagar correspondiente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <FormField label="N° de factura del proveedor" htmlFor="num_factura">
            <Input id="num_factura" placeholder="Ej. F001-00001234" {...register("num_factura", { required: true })} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de emisión" htmlFor="fecha_emision">
              <Input id="fecha_emision" type="date" {...register("fecha_emision", { required: true })} />
            </FormField>
            <FormField label="Fecha de vencimiento" htmlFor="fecha_vencimiento">
              <Input id="fecha_vencimiento" type="date" {...register("fecha_vencimiento", { required: true })} />
            </FormField>
          </div>

          <FormField label="Monto total (S/)" htmlFor="monto_total">
            <Input id="monto_total" type="number" min={0.01} step="0.01" {...register("monto_total", { required: true, min: 0.01 })} />
          </FormField>

          {mutation.data && !mutation.data.success && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.data.message || "No se pudo registrar la factura."}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

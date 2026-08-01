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

import { createSupplierAdvance } from "../api/purchases";

interface FormValues {
  id_destinatario: string;
  monto: string;
  fecha: string;
  medio_pago: string;
  referencia: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const MEDIOS_PAGO = ["Efectivo", "Transferencia", "Depósito", "Cheque", "Tarjeta"];

const emptyValues: FormValues = { id_destinatario: "", monto: "", fecha: todayISO(), medio_pago: "", referencia: "" };

interface AdvanceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvanceFormDialog({ isOpen, onClose }: AdvanceFormDialogProps) {
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
      createSupplierAdvance({
        id_destinatario: values.id_destinatario,
        monto: Number(values.monto),
        fecha: values.fecha,
        medio_pago: values.medio_pago,
        referencia: values.referencia || undefined,
      }),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["supplier-advances"] });
      onClose();
    },
  });

  const isValid =
    !!watch("id_destinatario") && Number(watch("monto")) > 0 && !!watch("fecha") && !!watch("medio_pago");

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo anticipo a proveedor</DialogTitle>
          <DialogDescription>Dinero entregado antes de recibir la factura. Se aplica después contra una cuenta por pagar.</DialogDescription>
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

          <FormField label="Monto (S/)" htmlFor="monto">
            <Input id="monto" type="number" min={0.01} step="0.01" {...register("monto", { required: true, min: 0.01 })} />
          </FormField>

          <FormField label="Fecha" htmlFor="fecha">
            <Input id="fecha" type="date" {...register("fecha", { required: true })} />
          </FormField>

          <FormField label="Medio de pago">
            <Controller
              control={control}
              name="medio_pago"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un medio" /></SelectTrigger>
                  <SelectContent>
                    {MEDIOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Referencia" htmlFor="referencia" optional>
            <Input id="referencia" placeholder="N° de operación…" {...register("referencia")} />
          </FormField>

          {mutation.data && !mutation.data.success && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.data.message || "No se pudo registrar el anticipo."}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar anticipo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

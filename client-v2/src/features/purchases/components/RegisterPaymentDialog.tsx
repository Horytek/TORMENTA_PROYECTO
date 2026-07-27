import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import { registerAccountPayablePayment } from "../api/purchases";
import type { AccountPayable } from "../types";

interface FormValues {
  monto: string;
  fecha: string;
  medio_pago: string;
  referencia: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const MEDIOS_PAGO = ["Efectivo", "Transferencia", "Depósito", "Cheque", "Tarjeta"];

interface RegisterPaymentDialogProps {
  cuenta: AccountPayable | null;
  onClose: () => void;
}

export default function RegisterPaymentDialog({ cuenta, onClose }: RegisterPaymentDialogProps) {
  const queryClient = useQueryClient();
  const isOpen = !!cuenta;

  const { control, register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: { monto: "", fecha: todayISO(), medio_pago: "", referencia: "" },
  });

  useEffect(() => {
    if (isOpen) reset({ monto: "", fecha: todayISO(), medio_pago: "", referencia: "" });
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      registerAccountPayablePayment(cuenta!.id, {
        monto: Number(values.monto),
        fecha: values.fecha,
        medio_pago: values.medio_pago,
        referencia: values.referencia || undefined,
      }),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
      onClose();
    },
  });

  const montoValido = Number(watch("monto")) > 0 && (!cuenta || Number(watch("monto")) <= cuenta.saldo);
  const isValid = montoValido && !!watch("fecha") && !!watch("medio_pago");

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Factura {cuenta?.num_factura} · Saldo pendiente: S/ {cuenta?.saldo.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Monto a abonar (S/)" htmlFor="monto">
            <Input id="monto" type="number" min={0.01} max={cuenta?.saldo} step="0.01" {...register("monto", { required: true, min: 0.01 })} />
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
              {mutation.data.message || "No se pudo registrar el pago."}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

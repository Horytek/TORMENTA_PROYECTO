import { useEffect, useMemo } from "react";
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

import { applySupplierAdvance, getAccountsPayable } from "../api/purchases";
import type { SupplierAdvance } from "../types";

interface FormValues {
  id_cuenta_por_pagar: string;
  monto: string;
}

interface ApplyAdvanceDialogProps {
  anticipo: SupplierAdvance | null;
  onClose: () => void;
}

export default function ApplyAdvanceDialog({ anticipo, onClose }: ApplyAdvanceDialogProps) {
  const queryClient = useQueryClient();
  const isOpen = !!anticipo;

  const { control, register, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: { id_cuenta_por_pagar: "", monto: "" },
  });

  useEffect(() => {
    if (isOpen) reset({ id_cuenta_por_pagar: "", monto: "" });
  }, [isOpen, reset]);

  // Solo cuentas del mismo proveedor: el backend lo vuelve a validar, esto es
  // para no ofrecer opciones que de todas formas va a rechazar.
  const { data: cuentas = [] } = useQuery({
    queryKey: ["accounts-payable", "proveedor", anticipo?.id_destinatario],
    queryFn: () => getAccountsPayable({ id_destinatario: anticipo!.id_destinatario }),
    enabled: isOpen,
  });
  const cuentasPendientes = useMemo(() => cuentas.filter((c) => c.estado !== "pagada"), [cuentas]);

  const cuentaSeleccionada = cuentasPendientes.find((c) => String(c.id) === watch("id_cuenta_por_pagar"));
  const maxAplicable = anticipo && cuentaSeleccionada
    ? Math.min(anticipo.saldo_disponible, cuentaSeleccionada.saldo)
    : 0;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      applySupplierAdvance(anticipo!.id, {
        id_cuenta_por_pagar: Number(values.id_cuenta_por_pagar),
        monto: Number(values.monto),
      }),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.invalidateQueries({ queryKey: ["supplier-advances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
      onClose();
    },
  });

  const montoValido = Number(watch("monto")) > 0 && Number(watch("monto")) <= maxAplicable;
  const isValid = !!watch("id_cuenta_por_pagar") && montoValido;

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar anticipo</DialogTitle>
          <DialogDescription>
            {anticipo?.proveedor} · Saldo disponible: S/ {anticipo?.saldo_disponible.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Cuenta por pagar">
            <Controller
              control={control}
              name="id_cuenta_por_pagar"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    field.onChange(v);
                    const cuenta = cuentasPendientes.find((c) => String(c.id) === v);
                    if (cuenta && anticipo) setValue("monto", String(Math.min(anticipo.saldo_disponible, cuenta.saldo)));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona una factura pendiente" /></SelectTrigger>
                  <SelectContent>
                    {cuentasPendientes.length === 0 && (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground">Este proveedor no tiene cuentas pendientes.</div>
                    )}
                    {cuentasPendientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.num_factura} · Saldo S/ {c.saldo.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Monto a aplicar (S/)" htmlFor="monto" hint={cuentaSeleccionada ? `Máximo: S/ ${maxAplicable.toFixed(2)}` : undefined}>
            <Input id="monto" type="number" min={0.01} max={maxAplicable || undefined} step="0.01" {...register("monto", { required: true, min: 0.01 })} />
          </FormField>

          {mutation.data && !mutation.data.success && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.data.message || "No se pudo aplicar el anticipo."}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

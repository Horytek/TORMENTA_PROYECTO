import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { createCuentaContable } from "../api/accounting";
import type { CuentaContable, CuentaContableInput, TipoCuenta, NaturalezaCuenta } from "../types";

interface AccountFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cuentas: CuentaContable[];
  defaultPadre?: CuentaContable | null;
}

const TIPOS: { value: TipoCuenta; label: string; naturaleza: NaturalezaCuenta }[] = [
  { value: "activo", label: "Activo", naturaleza: "deudora" },
  { value: "pasivo", label: "Pasivo", naturaleza: "acreedora" },
  { value: "patrimonio", label: "Patrimonio", naturaleza: "acreedora" },
  { value: "ingreso", label: "Ingresos", naturaleza: "acreedora" },
  { value: "costo", label: "Costos", naturaleza: "deudora" },
  { value: "gasto", label: "Gastos", naturaleza: "deudora" },
  { value: "orden", label: "Cuentas de Orden", naturaleza: "deudora" },
];

interface FormValues {
  codigo: string;
  nombre: string;
  id_cuenta_padre: string;
  tipo: TipoCuenta | "";
  es_conciliable: boolean;
  es_presupuestable: boolean;
  es_auxiliar: boolean;
}

export function AccountFormDialog({ isOpen, onClose, cuentas, defaultPadre }: AccountFormDialogProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      codigo: "", nombre: "",
      id_cuenta_padre: defaultPadre ? String(defaultPadre.id_cuenta) : "",
      tipo: defaultPadre?.tipo || "",
      es_conciliable: false, es_presupuestable: false, es_auxiliar: false,
    },
  });

  const tipoSeleccionado = watch("tipo");

  const mutation = useMutation({
    mutationFn: (values: CuentaContableInput) => createCuentaContable(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuentas-contables"] });
      reset();
      onClose();
    },
  });

  const onSubmit = (values: FormValues) => {
    const tipoDef = TIPOS.find((t) => t.value === values.tipo);
    if (!tipoDef) return;
    mutation.mutate({
      codigo: values.codigo.trim(),
      nombre: values.nombre.trim(),
      id_cuenta_padre: values.id_cuenta_padre ? Number(values.id_cuenta_padre) : null,
      tipo: tipoDef.value,
      naturaleza: tipoDef.naturaleza,
      es_conciliable: values.es_conciliable,
      es_presupuestable: values.es_presupuestable,
      es_auxiliar: values.es_auxiliar,
    });
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title="Nueva cuenta contable"
      description="Se agrega al plan de cuentas de tu empresa."
      submitLabel="Guardar cuenta"
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo crear la cuenta. Verifica que el código no esté repetido." : null}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código" htmlFor="cuenta-codigo" error={errors.codigo?.message}>
          <Input id="cuenta-codigo" placeholder="Ej: 1011" {...register("codigo", { required: "El código es obligatorio" })} />
        </FormField>
        <FormField label="Tipo">
          <Controller
            control={control}
            name="tipo"
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField label="Nombre" htmlFor="cuenta-nombre" error={errors.nombre?.message}>
        <Input id="cuenta-nombre" placeholder="Ej: Caja Sucursal Central" {...register("nombre", { required: "El nombre es obligatorio" })} />
      </FormField>

      <FormField label="Cuenta padre (opcional)">
        <Controller
          control={control}
          name="id_cuenta_padre"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Sin cuenta padre (cuenta de primer nivel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cuenta padre</SelectItem>
                {cuentas
                  .filter((c) => !tipoSeleccionado || c.tipo === tipoSeleccionado)
                  .map((c) => (
                    <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Controller control={control} name="es_conciliable" render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Conciliable
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Controller control={control} name="es_presupuestable" render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Presupuestable
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Controller control={control} name="es_auxiliar" render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Auxiliar
        </label>
      </div>
    </FormDialog>
  );
}

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { getContabilidadConfig, saveContabilidadConfig, deleteContabilidadConfig, getCuentasContables } from "../api/accounting";
import type { ContabilidadConfigItem, ContabilidadConfigInput } from "../types";

const CONCEPTOS_SUGERIDOS = [
  { value: "ventas.ingreso", label: "Ventas — cuenta de ingreso" },
  { value: "ventas.igv", label: "Ventas — IGV por pagar" },
  { value: "gastos.default", label: "Gastos — cuenta por defecto" },
  { value: "caja.efectivo", label: "Caja — efectivo" },
  { value: "inventario.mermas", label: "Inventario — mermas" },
];

export function AccountingConfigPanel() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ContabilidadConfigItem | null>(null);

  const { data: config = [], isLoading } = useQuery({ queryKey: ["contabilidad-config"], queryFn: getContabilidadConfig });
  const { data: cuentas = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });
  const cuentasMovibles = cuentas.filter((c) => c.permite_movimiento === 1);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ContabilidadConfigInput>({
    defaultValues: { concepto: "", descripcion: "", id_cuenta: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (values: ContabilidadConfigInput) => saveContabilidadConfig(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contabilidad-config"] });
      reset();
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContabilidadConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contabilidad-config"] });
      setDeleting(null);
    },
  });

  const fields: FieldDef<ContabilidadConfigItem>[] = [
    { key: "concepto", priority: "primary", semantic: "code", label: "Concepto" },
    { key: "descripcion", priority: "meta", semantic: "text", label: "Descripción" },
    {
      key: "cuenta_codigo", priority: "secondary", semantic: "chip", label: "Cuenta",
      render: (_v, item) => `${item.cuenta_codigo} — ${item.cuenta_nombre}`,
    },
  ];

  const actions: RecordAction[] = [
    {
      id: "delete", label: "Eliminar", icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as ContabilidadConfigItem),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mapeo de conceptos operativos a cuentas contables. Ningún módulo debería tener cuentas escritas directamente en el código.
        </p>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo mapeo
        </Button>
      </div>

      <AdaptiveCollection<ContabilidadConfigItem>
        items={config}
        fields={fields}
        actions={actions}
        layout="list"
        isLoading={isLoading}
        getItemId={(c) => c.id_config}
        empty={{ title: "Sin configuración contable", description: "Define el primer mapeo concepto → cuenta." }}
      />

      <FormDialog
        open={isFormOpen}
        onClose={() => { reset(); setIsFormOpen(false); }}
        title="Nuevo mapeo contable"
        submitLabel="Guardar"
        isSubmitting={saveMutation.isPending}
        error={saveMutation.isError ? "No se pudo guardar el mapeo." : null}
        onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
      >
        <FormField label="Concepto" htmlFor="config-concepto" error={errors.concepto?.message}>
          <Input
            id="config-concepto" list="conceptos-sugeridos" placeholder="Ej: ventas.ingreso"
            {...register("concepto", { required: "El concepto es obligatorio" })}
          />
          <datalist id="conceptos-sugeridos">
            {CONCEPTOS_SUGERIDOS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </datalist>
        </FormField>
        <FormField label="Descripción (opcional)" htmlFor="config-desc">
          <Input id="config-desc" placeholder="Para qué se usa este mapeo" {...register("descripcion")} />
        </FormField>
        <FormField label="Cuenta contable">
          <Controller
            control={control}
            name="id_cuenta"
            rules={{ validate: (v) => Number(v) > 0 }}
            render={({ field }) => (
              <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecciona una cuenta..." /></SelectTrigger>
                <SelectContent>
                  {cuentasMovibles.map((c) => (
                    <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="¿Eliminar mapeo?"
        description={`Se eliminará el mapeo "${deleting?.concepto}".`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id_config)}
      />
    </div>
  );
}

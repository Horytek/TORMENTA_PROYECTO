import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection";
import { getCentrosCosto, createCentroCosto } from "../api/accounting";
import type { CentroCosto, CentroCostoInput } from "../types";

export function CostCentersPanel() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: centros = [], isLoading } = useQuery({ queryKey: ["centros-costo"], queryFn: getCentrosCosto });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CentroCostoInput>({
    defaultValues: { codigo: "", nombre: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: CentroCostoInput) => createCentroCosto(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros-costo"] });
      reset();
      setIsFormOpen(false);
    },
  });

  const fields: FieldDef<CentroCosto>[] = [
    { key: "nombre", priority: "primary", semantic: "title", label: "Nombre" },
    { key: "codigo", priority: "secondary", semantic: "chip", label: "Código" },
    { key: "nombre_sucursal", priority: "meta", semantic: "text", label: "Sucursal" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Dimensión para asignar gastos e ingresos a áreas, proyectos o sucursales.</p>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo centro de costo
        </Button>
      </div>

      <AdaptiveCollection<CentroCosto>
        items={centros}
        fields={fields}
        layout="list"
        isLoading={isLoading}
        getItemId={(c) => c.id_centro_costo}
        empty={{ title: "Sin centros de costo", description: "Crea el primer centro de costo para poder asignarlo en los asientos." }}
      />

      <FormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Nuevo centro de costo"
        submitLabel="Guardar"
        isSubmitting={mutation.isPending}
        error={mutation.isError ? "No se pudo crear. Verifica que el código no esté repetido." : null}
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
      >
        <FormField label="Código" htmlFor="cc-codigo" error={errors.codigo?.message}>
          <Input id="cc-codigo" placeholder="Ej: CC-001" {...register("codigo", { required: "El código es obligatorio" })} />
        </FormField>
        <FormField label="Nombre" htmlFor="cc-nombre" error={errors.nombre?.message}>
          <Input id="cc-nombre" placeholder="Ej: Área Comercial" {...register("nombre", { required: "El nombre es obligatorio" })} />
        </FormField>
      </FormDialog>
    </div>
  );
}

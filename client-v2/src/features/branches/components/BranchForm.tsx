import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";

import { createSucursal, updateSucursal, getVendedores } from "../api/branches";
import type { Sucursal, SucursalInput } from "../types";

interface BranchFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Sucursal | null;
}

interface FormValues {
  nombre_sucursal: string;
  ubicacion: string;
  dni: string;
  estado_sucursal: string;
}

const empty: FormValues = { nombre_sucursal: "", ubicacion: "", dni: "", estado_sucursal: "1" };

export default function BranchForm({ isOpen, onClose, initialData }: BranchFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: empty });

  useEffect(() => {
    if (initialData) {
      reset({
        nombre_sucursal: initialData.nombre_sucursal ?? "",
        ubicacion: initialData.ubicacion ?? "",
        dni: initialData.dni ?? "",
        estado_sucursal: String(initialData.estado_sucursal ?? 1),
      });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: SucursalInput = {
        nombre_sucursal: values.nombre_sucursal,
        ubicacion: values.ubicacion,
        dni: values.dni || undefined,
        estado_sucursal: Number(values.estado_sucursal),
        ...(isEdit ? { id: initialData!.id_sucursal } : {}),
      };
      return isEdit ? updateSucursal(input) : createSucursal(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar sucursal" : "Nueva sucursal"}
      description={isEdit ? "Actualiza los datos de la sucursal." : "Registra una sucursal y asígnale un vendedor."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear sucursal"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar la sucursal. Verifica los datos e intenta de nuevo." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField label="Nombre de la sucursal" htmlFor="nombre_sucursal" error={errors.nombre_sucursal?.message}>
        <Input
          id="nombre_sucursal"
          placeholder="Tienda Centro"
          {...register("nombre_sucursal", { required: "El nombre es requerido" })}
        />
      </FormField>

      <FormField label="Ubicación" htmlFor="ubicacion" error={errors.ubicacion?.message}>
        <Input
          id="ubicacion"
          placeholder="Av. Grau 123, Lima"
          {...register("ubicacion", { required: "La ubicación es requerida" })}
        />
      </FormField>

      <FormField
        label="Vendedor asignado"
        error={errors.dni?.message}
        hint={isEdit ? "Deja el actual o selecciona otro vendedor." : undefined}
      >
        <Controller
          control={control}
          name="dni"
          rules={{ required: isEdit ? false : "Selecciona un vendedor" }}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No hay vendedores activos
                  </SelectItem>
                ) : (
                  vendedores.map((v) => (
                    <SelectItem key={v.dni} value={v.dni}>
                      {v.nombre_completo} · {v.dni}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Estado">
        <Controller
          control={control}
          name="estado_sucursal"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Activa</SelectItem>
                <SelectItem value="0">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    </FormDialog>
  );
}

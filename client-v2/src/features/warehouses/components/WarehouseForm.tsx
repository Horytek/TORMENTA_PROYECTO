import { useEffect, useMemo } from "react";
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

import { createAlmacen, updateAlmacen, getSucursalesDisponibles } from "../api/warehouses";
import type { Almacen, AlmacenInput, SucursalOption } from "../types";

interface WarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Almacen | null;
}

interface FormValues {
  nom_almacen: string;
  ubicacion: string;
  id_sucursal: string;
  estado_almacen: string;
}

const empty: FormValues = { nom_almacen: "", ubicacion: "", id_sucursal: "", estado_almacen: "1" };

export default function WarehouseForm({ isOpen, onClose, initialData }: WarehouseFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { data: sucursales = [] } = useQuery({
    queryKey: ["sucursales-disponibles"],
    queryFn: getSucursalesDisponibles,
    enabled: isOpen,
  });

  // Al editar, la sucursal asignada no aparece en "disponibles": la agregamos.
  const options = useMemo<SucursalOption[]>(() => {
    const list = [...sucursales];
    if (
      initialData?.id_sucursal &&
      !list.some((s) => Number(s.id_sucursal) === Number(initialData.id_sucursal))
    ) {
      list.unshift({
        id_sucursal: initialData.id_sucursal,
        nombre_sucursal: initialData.nombre_sucursal || `Sucursal ${initialData.id_sucursal}`,
      });
    }
    return list;
  }, [sucursales, initialData]);

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
        nom_almacen: initialData.nom_almacen ?? "",
        ubicacion: initialData.ubicacion ?? "",
        id_sucursal: initialData.id_sucursal ? String(initialData.id_sucursal) : "",
        estado_almacen: String(initialData.estado_almacen ?? 1),
      });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: AlmacenInput = {
        nom_almacen: values.nom_almacen,
        ubicacion: values.ubicacion,
        id_sucursal: values.id_sucursal ? Number(values.id_sucursal) : null,
        estado_almacen: Number(values.estado_almacen),
        ...(isEdit ? { id: initialData!.id_almacen } : {}),
      };
      return isEdit ? updateAlmacen(input) : createAlmacen(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["almacenes"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar almacén" : "Nuevo almacén"}
      description={isEdit ? "Actualiza los datos del almacén." : "Registra un almacén y asígnalo a una sucursal."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear almacén"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el almacén. Intenta de nuevo." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField label="Nombre del almacén" htmlFor="nom_almacen" error={errors.nom_almacen?.message}>
        <Input
          id="nom_almacen"
          placeholder="Almacén Central"
          {...register("nom_almacen", { required: "El nombre es requerido" })}
        />
      </FormField>

      <FormField label="Ubicación" htmlFor="ubicacion" optional>
        <Input id="ubicacion" placeholder="Jr. Comercio 456" {...register("ubicacion")} />
      </FormField>

      <FormField label="Sucursal" error={errors.id_sucursal?.message}>
        <Controller
          control={control}
          name="id_sucursal"
          rules={{ required: "Selecciona una sucursal" }}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {options.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No hay sucursales disponibles
                  </SelectItem>
                ) : (
                  options.map((s) => (
                    <SelectItem key={s.id_sucursal} value={String(s.id_sucursal)}>
                      {s.nombre_sucursal}
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
          name="estado_almacen"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Activo</SelectItem>
                <SelectItem value="0">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    </FormDialog>
  );
}

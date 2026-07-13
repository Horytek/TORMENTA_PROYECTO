import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

import { createRol, updateRol } from "../api/roles";
import type { Rol } from "../types";

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Rol | null;
}

interface FormValues {
  nom_rol: string;
  estado_rol: string;
}

const empty: FormValues = { nom_rol: "", estado_rol: "1" };

export default function RoleForm({ isOpen, onClose, initialData }: RoleFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: empty });

  useEffect(() => {
    if (initialData) {
      reset({ nom_rol: initialData.nom_rol ?? "", estado_rol: String(initialData.estado_rol ?? 1) });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input = { nom_rol: values.nom_rol, estado_rol: Number(values.estado_rol) };
      return isEdit ? updateRol(initialData!.id_rol, input) : createRol(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar rol" : "Nuevo rol"}
      description={isEdit ? "Actualiza el nombre o el estado del rol." : "Crea un rol. Sus permisos se configuran luego."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear rol"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el rol. Puede que el nombre ya exista." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField label="Nombre del rol" htmlFor="nom_rol" error={errors.nom_rol?.message}>
        <Input
          id="nom_rol"
          placeholder="Vendedor, Almacenero…"
          {...register("nom_rol", {
            required: "El nombre es requerido",
            minLength: { value: 2, message: "Mínimo 2 caracteres" },
          })}
        />
      </FormField>

      <FormField label="Estado">
        <Controller
          control={control}
          name="estado_rol"
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

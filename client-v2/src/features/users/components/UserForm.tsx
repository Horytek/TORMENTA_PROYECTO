import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";

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
import { useUserStore } from "@/store/useUserStore";

import { createUsuario, updateUsuario, getRoles } from "../api/users";
import type { Usuario, Rol, UsuarioInput } from "../types";
import { RESERVED_ROLES } from "../types";

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Usuario | null;
}

interface FormValues {
  usua: string;
  contra: string;
  id_rol: string;
  estado_usuario: string;
}

const empty: FormValues = { usua: "", contra: "", id_rol: "", estado_usuario: "1" };

export default function UserForm({ isOpen, onClose, initialData }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;
  const currentEmpresa = useUserStore((s) => s.user?.id_empresa ?? null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: getRoles, enabled: isOpen });

  // Roles asignables (sin owner/developer); conserva el rol actual aunque sea reservado.
  const roleOptions = useMemo<Rol[]>(() => {
    const list = roles.filter((r) => !RESERVED_ROLES.includes(r.id_rol));
    if (
      initialData &&
      RESERVED_ROLES.includes(initialData.id_rol) &&
      !list.some((r) => r.id_rol === initialData.id_rol)
    ) {
      list.unshift({ id_rol: initialData.id_rol, nom_rol: initialData.nom_rol || `Rol ${initialData.id_rol}` });
    }
    return list;
  }, [roles, initialData]);

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
        usua: initialData.usua ?? "",
        contra: "",
        id_rol: String(initialData.id_rol ?? ""),
        estado_usuario: String(initialData.estado_usuario ?? 1),
      });
    } else {
      reset(empty);
    }
    setShowPassword(false);
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (isEdit) {
        const patch: Partial<UsuarioInput> = {
          usua: values.usua,
          id_rol: Number(values.id_rol),
          estado_usuario: Number(values.estado_usuario),
          ...(values.contra ? { contra: values.contra } : {}),
        };
        return updateUsuario(initialData!.id_usuario, patch);
      }
      const input: UsuarioInput = {
        usua: values.usua,
        contra: values.contra,
        id_rol: Number(values.id_rol),
        estado_usuario: Number(values.estado_usuario),
        id_empresa: currentEmpresa,
      };
      return createUsuario(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={isEdit ? "Actualiza los datos de acceso del usuario." : "Crea una cuenta de acceso al sistema."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear usuario"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el usuario. Verifica que el usuario no exista ya." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField label="Usuario" htmlFor="usua" error={errors.usua?.message}>
        <Input
          id="usua"
          placeholder="nombre.apellido"
          autoComplete="off"
          {...register("usua", {
            required: "El usuario es requerido",
            minLength: { value: 3, message: "Mínimo 3 caracteres" },
          })}
        />
      </FormField>

      <FormField
        label={isEdit ? "Nueva contraseña" : "Contraseña"}
        htmlFor="contra"
        error={errors.contra?.message}
        hint={isEdit ? "Déjala en blanco para no cambiarla." : undefined}
      >
        <div className="relative">
          <Input
            id="contra"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pr-10"
            {...register("contra", {
              validate: (v) =>
                isEdit || v.length >= 6 || "La contraseña debe tener al menos 6 caracteres",
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      <FormField label="Rol" error={errors.id_rol?.message}>
        <Controller
          control={control}
          name="id_rol"
          rules={{ required: "Selecciona un rol" }}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No hay roles disponibles
                  </SelectItem>
                ) : (
                  roleOptions.map((r) => (
                    <SelectItem key={r.id_rol} value={String(r.id_rol)}>
                      {r.nom_rol}
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
          name="estado_usuario"
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

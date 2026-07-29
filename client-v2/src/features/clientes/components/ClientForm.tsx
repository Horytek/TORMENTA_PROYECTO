import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";

import { createCliente, updateCliente } from "../api/clientes";
import type { Cliente, ClienteInput, TipoCliente } from "../types";
import { clienteTipo } from "../types";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Cliente | null;
}

interface FormValues {
  tipo: TipoCliente;
  dni: string;
  ruc: string;
  nombres: string;
  apellidos: string;
  razon_social: string;
  direccion: string;
  limite_credito: string;
}

const empty: FormValues = {
  tipo: "natural",
  dni: "",
  ruc: "",
  nombres: "",
  apellidos: "",
  razon_social: "",
  direccion: "",
  limite_credito: "",
};

export default function ClientForm({ isOpen, onClose, initialData }: ClientFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: empty });

  const tipo = watch("tipo");

  useEffect(() => {
    if (initialData) {
      reset({
        tipo: clienteTipo(initialData),
        dni: initialData.dni ?? "",
        ruc: initialData.ruc ?? "",
        nombres: initialData.nombres ?? "",
        apellidos: initialData.apellidos ?? "",
        razon_social: initialData.razon_social ?? "",
        direccion: initialData.direccion ?? "",
        limite_credito: initialData.limite_credito != null ? String(initialData.limite_credito) : "",
      });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ClienteInput = {
        direccion: values.direccion.trim() || undefined,
        estado: initialData?.estado ?? 1,
        limite_credito: values.limite_credito.trim() ? Number(values.limite_credito) : null,
        ...(isEdit ? { id_cliente: initialData!.id } : {}),
        ...(values.tipo === "natural"
          ? { dni: values.dni.trim(), nombres: values.nombres.trim(), apellidos: values.apellidos.trim() }
          : { ruc: values.ruc.trim(), razon_social: values.razon_social.trim() }),
      };
      return isEdit ? updateCliente(payload) : createCliente(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      description={isEdit ? "Actualiza los datos del cliente." : "Registra un cliente natural o jurídico."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear cliente"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el cliente. Intenta de nuevo." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      {/* Tipo de cliente */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "natural", label: "Persona natural", icon: User },
          { key: "juridico", label: "Persona jurídica", icon: Building2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setValue("tipo", key)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              tipo === key
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tipo === "natural" ? (
        <>
          <FormField label="DNI" htmlFor="dni" error={errors.dni?.message}>
            <Input
              id="dni"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              className="num"
              {...register("dni", {
                required: "El DNI es requerido",
                pattern: { value: /^\d{8}$/, message: "El DNI debe tener 8 dígitos" },
              })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nombres" htmlFor="nombres" error={errors.nombres?.message}>
              <Input id="nombres" placeholder="Juan" {...register("nombres", { required: "Requerido" })} />
            </FormField>
            <FormField label="Apellidos" htmlFor="apellidos" error={errors.apellidos?.message}>
              <Input id="apellidos" placeholder="Pérez" {...register("apellidos", { required: "Requerido" })} />
            </FormField>
          </div>
        </>
      ) : (
        <>
          <FormField label="RUC" htmlFor="ruc" error={errors.ruc?.message}>
            <Input
              id="ruc"
              inputMode="numeric"
              maxLength={11}
              placeholder="20123456789"
              className="num"
              {...register("ruc", {
                required: "El RUC es requerido",
                pattern: { value: /^\d{11}$/, message: "El RUC debe tener 11 dígitos" },
              })}
            />
          </FormField>
          <FormField label="Razón social" htmlFor="razon_social" error={errors.razon_social?.message}>
            <Input
              id="razon_social"
              placeholder="Textiles Creando Moda S.A.C."
              {...register("razon_social", { required: "La razón social es requerida" })}
            />
          </FormField>
        </>
      )}

      <FormField label="Dirección" htmlFor="direccion" optional>
        <Input id="direccion" placeholder="Av. Siempre Viva 123" {...register("direccion")} />
      </FormField>

      <FormField label="Límite de crédito (S/.)" htmlFor="limite_credito" optional>
        <Input
          id="limite_credito"
          type="number"
          min={0}
          step="0.01"
          placeholder="Sin límite"
          {...register("limite_credito")}
        />
      </FormField>
    </FormDialog>
  );
}

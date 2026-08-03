import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";

import { createProveedor, updateProveedor } from "../api/suppliers";
import type { Proveedor, ProveedorInput, TipoProveedor } from "../types";
import { proveedorTipo } from "../types";

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Proveedor | null;
}

interface FormValues {
  tipo: TipoProveedor;
  dni: string;
  ruc: string;
  nombres: string;
  apellidos: string;
  razon_social: string;
  telefono: string;
  email: string;
  direccion: string;
  plazo_pago_dias: string;
  linea_credito: string;
}

const empty: FormValues = {
  tipo: "juridico",
  dni: "",
  ruc: "",
  nombres: "",
  apellidos: "",
  razon_social: "",
  telefono: "",
  email: "",
  direccion: "",
  plazo_pago_dias: "",
  linea_credito: "",
};

export default function SupplierForm({ isOpen, onClose, initialData }: SupplierFormProps) {
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
        tipo: proveedorTipo(initialData),
        dni: initialData.dni ?? "",
        ruc: initialData.ruc ?? "",
        nombres: initialData.nombres ?? "",
        apellidos: initialData.apellidos ?? "",
        razon_social: initialData.razon_social ?? "",
        telefono: initialData.telefono ?? "",
        email: initialData.email ?? "",
        direccion: initialData.direccion ?? "",
        plazo_pago_dias: initialData.plazo_pago_dias != null ? String(initialData.plazo_pago_dias) : "",
        linea_credito: initialData.linea_credito != null ? String(initialData.linea_credito) : "",
      });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: ProveedorInput = {
        ...values,
        estado: initialData?.estado ?? 1,
        plazo_pago_dias: values.plazo_pago_dias.trim() ? Number(values.plazo_pago_dias) : null,
        linea_credito: values.linea_credito.trim() ? Number(values.linea_credito) : null,
      };
      return isEdit ? updateProveedor(initialData!.id, input) : createProveedor(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      description={isEdit ? "Actualiza los datos del proveedor." : "Registra un proveedor natural o jurídico."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear proveedor"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el proveedor. Intenta de nuevo." : null}
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "juridico", label: "Persona jurídica", icon: Building2 },
          { key: "natural", label: "Persona natural", icon: User },
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
              placeholder="Distribuidora Textil S.A.C."
              {...register("razon_social", { required: "La razón social es requerida" })}
            />
          </FormField>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Teléfono" htmlFor="telefono" optional>
          <Input id="telefono" inputMode="tel" placeholder="999888777" className="num" {...register("telefono")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} optional>
          <Input
            id="email"
            type="email"
            placeholder="contacto@empresa.pe"
            {...register("email", {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
            })}
          />
        </FormField>
      </div>

      <FormField label="Dirección" htmlFor="direccion" optional>
        <Input id="direccion" placeholder="Av. Industrial 456" {...register("direccion")} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Plazo de pago (días)" htmlFor="plazo_pago_dias" optional>
          <Input id="plazo_pago_dias" type="number" min={0} inputMode="numeric" placeholder="30" {...register("plazo_pago_dias")} />
        </FormField>
        <FormField label="Línea de crédito (S/)" htmlFor="linea_credito" optional>
          <Input id="linea_credito" type="number" min={0} step="0.01" placeholder="Sin límite" {...register("linea_credito")} />
        </FormField>
      </div>
    </FormDialog>
  );
}

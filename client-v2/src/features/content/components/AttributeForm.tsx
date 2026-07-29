import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";

import { createAttribute, updateAttribute } from "../api/content";
import type { Attribute, AttributeInput, TipoInput } from "../types";
import { TIPO_LABELS } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: Attribute | null;
}

interface FormValues {
  nombre: string;
  tipo_input: TipoInput;
  es_filtro: boolean;
  es_visible: boolean;
  es_requerido: boolean;
}

const empty: FormValues = {
  nombre: "",
  tipo_input: "SELECT",
  es_filtro: true,
  es_visible: true,
  es_requerido: false,
};

const FLAGS: { key: "es_filtro" | "es_visible" | "es_requerido"; label: string; hint: string }[] = [
  { key: "es_visible", label: "Visible en la tienda", hint: "Se muestra al cliente" },
  { key: "es_filtro", label: "Usar como filtro", hint: "Permite filtrar productos" },
  { key: "es_requerido", label: "Obligatorio", hint: "Requerido al crear variantes" },
];

export default function AttributeForm({ isOpen, onClose, initialData }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: empty,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nombre: initialData.nombre ?? "",
        tipo_input: (initialData.tipo_input as TipoInput) || "SELECT",
        es_filtro: !!initialData.es_filtro,
        es_visible: !!initialData.es_visible,
        es_requerido: !!initialData.es_requerido,
      });
    } else {
      reset(empty);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: AttributeInput = { ...values };
      return isEdit ? updateAttribute(initialData!.id_atributo, input) : createAttribute(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      onClose();
    },
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar atributo" : "Nuevo atributo"}
      description={isEdit ? "Actualiza el atributo." : "Los atributos definen las variantes de tus productos (color, talla, material…)."}
      submitLabel={isEdit ? "Guardar cambios" : "Crear atributo"}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo guardar el atributo. Puede que el nombre ya exista." : null}
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
    >
      <FormField label="Nombre" htmlFor="attr-nombre" error={errors.nombre?.message}>
        <Input id="attr-nombre" placeholder="Color, Talla, Material…" {...register("nombre", { required: "El nombre es requerido" })} />
      </FormField>

      <FormField label="Tipo de entrada">
        <Controller
          control={control}
          name="tipo_input"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="space-y-2.5 rounded-md border border-border bg-muted/30 p-3">
        {FLAGS.map((f) => (
          <Controller
            key={f.key}
            control={control}
            name={f.key}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                <span className="leading-tight">
                  <span className="block text-sm font-medium text-foreground">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
              </label>
            )}
          />
        ))}
      </div>
    </FormDialog>
  );
}

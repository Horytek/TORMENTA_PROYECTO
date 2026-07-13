import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Building2, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField } from "@/components/shared/FormField";

import { getNegocio, updateNegocio } from "../api/settings";
import type { Negocio } from "../types";

interface FormValues {
  nombre_negocio: string;
  ruc: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  telefono: string;
  email: string;
}

const empty: FormValues = {
  nombre_negocio: "",
  ruc: "",
  direccion: "",
  distrito: "",
  provincia: "",
  departamento: "",
  telefono: "",
  email: "",
};

const toForm = (n: Negocio | null): FormValues => ({
  nombre_negocio: n?.nombre_negocio ?? "",
  ruc: n?.ruc ?? "",
  direccion: n?.direccion ?? "",
  distrito: n?.distrito ?? "",
  provincia: n?.provincia ?? "",
  departamento: n?.departamento ?? "",
  telefono: n?.telefono ?? "",
  email: n?.email ?? "",
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: negocio, isLoading } = useQuery({ queryKey: ["negocio"], queryFn: getNegocio });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: empty });

  useEffect(() => {
    if (negocio !== undefined) reset(toForm(negocio ?? null));
  }, [negocio, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateNegocio(values),
    onSuccess: (_ok, values) => {
      queryClient.invalidateQueries({ queryKey: ["negocio"] });
      reset(values); // limpia isDirty tras guardar
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuración del negocio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estos datos aparecen en tus comprobantes y reportes.
          </p>
        </div>
        <Button type="submit" disabled={mutation.isPending || !isDirty} className="gap-2 self-start sm:self-auto">
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mutation.isSuccess && !isDirty ? (
            <Check className="h-4 w-4" />
          ) : null}
          {mutation.isPending ? "Guardando…" : mutation.isSuccess && !isDirty ? "Guardado" : "Guardar cambios"}
        </Button>
      </div>

      {mutation.isError && (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se pudieron guardar los cambios. Intenta de nuevo.
        </p>
      )}

      {/* Datos del negocio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-brand" />
            Datos del negocio
          </CardTitle>
          <CardDescription>Nombre comercial y RUC de la empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre del negocio" htmlFor="nombre_negocio" error={errors.nombre_negocio?.message}>
            <Input id="nombre_negocio" placeholder="Mi Tienda S.A.C." {...register("nombre_negocio", { required: "Requerido" })} />
          </FormField>
          <FormField label="RUC" htmlFor="ruc" error={errors.ruc?.message}>
            <Input
              id="ruc"
              inputMode="numeric"
              maxLength={11}
              placeholder="20123456789"
              className="num"
              {...register("ruc", { pattern: { value: /^\d{11}$/, message: "El RUC debe tener 11 dígitos" } })}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-brand" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Dirección" htmlFor="direccion">
            <Input id="direccion" placeholder="Av. Principal 123" {...register("direccion")} />
          </FormField>
          <FormField label="Distrito" htmlFor="distrito">
            <Input id="distrito" placeholder="Miraflores" {...register("distrito")} />
          </FormField>
          <FormField label="Provincia" htmlFor="provincia">
            <Input id="provincia" placeholder="Lima" {...register("provincia")} />
          </FormField>
          <FormField label="Departamento" htmlFor="departamento">
            <Input id="departamento" placeholder="Lima" {...register("departamento")} />
          </FormField>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-brand" />
            Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono" htmlFor="telefono">
            <Input id="telefono" inputMode="tel" placeholder="999888777" className="num" {...register("telefono")} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="contacto@negocio.pe"
              {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" } })}
            />
          </FormField>
        </CardContent>
      </Card>
    </form>
  );
}

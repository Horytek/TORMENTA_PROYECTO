import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Building2, MapPin, Phone, ImageIcon, Upload, X, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  igv_incluido: boolean;
  moneda: string;
  pais: string;
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
  igv_incluido: true,
  moneda: "",
  pais: "",
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
  igv_incluido: n?.igv_incluido ?? true,
  moneda: n?.moneda ?? "",
  pais: n?.pais ?? "",
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: negocio, isLoading } = useQuery({ queryKey: ["negocio"], queryFn: getNegocio });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: empty, values: toForm(negocio ?? null) });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (negocio !== undefined) reset(toForm(negocio ?? null));
  }, [negocio, reset]);

  const onPickLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateNegocio(values, logoFile),
    onSuccess: (_ok, values) => {
      queryClient.invalidateQueries({ queryKey: ["negocio"] });
      reset(values); // limpia isDirty tras guardar
      clearLogo();
    },
  });

  const canSave = (isDirty || !!logoFile) && !mutation.isPending;

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
        <Button type="submit" disabled={!canSave} className="gap-2 self-start sm:self-auto">
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

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-brand" />
            Logotipo
          </CardTitle>
          <CardDescription>Se muestra en tus comprobantes. PNG o JPG.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {logoPreview || negocio?.logotipo_url ? (
              <img src={logoPreview ?? negocio?.logotipo_url} alt="Logotipo" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickLogo} className="hidden" />
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              {logoFile ? "Cambiar imagen" : "Subir logotipo"}
            </Button>
            {logoFile && (
              <button type="button" onClick={clearLogo} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
                Quitar selección ({logoFile.name})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

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

          {/* Toggle IGV incluido — spanned 2 cols */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-zinc-50 px-4 py-3 dark:bg-zinc-900/50 sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Precio incluye IGV (18%)</p>
                <p className="text-xs text-muted-foreground">
                  {watch("igv_incluido")
                    ? "El precio del producto ya contiene el IGV — se calculará la base imponible"
                    : "El precio es base imponible — el IGV se agregará encima del precio"}
                </p>
              </div>
            </div>
            <Switch
              checked={watch("igv_incluido")}
              onCheckedChange={(v) => setValue("igv_incluido", v, { shouldDirty: true })}
            />
          </div>

          {/* Moneda */}
          <FormField label="Moneda" htmlFor="moneda">
            <Input id="moneda" placeholder="PEN" maxLength={10} {...register("moneda")} />
          </FormField>

          {/* País */}
          <FormField label="País" htmlFor="pais">
            <Input id="pais" placeholder="Perú" {...register("pais")} />
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

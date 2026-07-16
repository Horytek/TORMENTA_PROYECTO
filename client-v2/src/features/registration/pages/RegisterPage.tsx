import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Sparkles, Building2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/shared/FormField";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { createPreference } from "@/features/account/api/billing";
import { setPendingPaymentFlow } from "@/features/landing/utils/paymentFlow";
import { PLANS, type Plan } from "@/features/landing/data/landing.data";

import { addEmpresaPublic, addUsuarioLandingPublic, generateAdminCredentials, PLAN_PAGO_MAP } from "../api/registration";
import type { RegisterFormValues } from "../types";

const emptyForm: RegisterFormValues = {
  nombre: "",
  apellido: "",
  ruc: "",
  razonSocial: "",
  direccion: "",
  telefonoEmpresa: "",
  emailEmpresa: "",
  pais: "Perú",
  aceptaTerminos: false,
};

export default function RegisterPage() {
  const [params] = useSearchParams();
  const planId = params.get("plan") || "basico";
  const period = params.get("period") === "año" ? "año" : "mes";

  const plan: Plan = PLANS.find((p) => p.id === planId) || PLANS[0];
  const price = period === "año" ? plan.yearly : plan.monthly;

  const [values, setValues] = useState<RegisterFormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [emailSubmitted, setEmailSubmitted] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof RegisterFormValues>(key: K, value: RegisterFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof RegisterFormValues, string>> = {};
    if (!values.nombre.trim()) next.nombre = "Requerido";
    if (!values.apellido.trim()) next.apellido = "Requerido";
    if (!/^\d{11}$/.test(values.ruc.trim())) next.ruc = "RUC inválido (11 dígitos)";
    if (!values.razonSocial.trim()) next.razonSocial = "Requerido";
    if (!values.direccion.trim()) next.direccion = "Requerido";
    if (!values.emailEmpresa.trim()) next.emailEmpresa = "Requerido";
    if (!values.telefonoEmpresa.trim()) next.telefonoEmpresa = "Requerido";
    if (!values.aceptaTerminos) next.aceptaTerminos = "Debes aceptar los términos";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async (form: RegisterFormValues) => {
      const plan_pago = PLAN_PAGO_MAP[plan.id] ?? 3;

      const empresaResult = await addEmpresaPublic({
        ruc: form.ruc.trim(),
        razonSocial: form.razonSocial.trim(),
        nombreComercial: null,
        direccion: form.direccion.trim(),
        distrito: null,
        provincia: null,
        departamento: null,
        codigoPostal: null,
        telefono: form.telefonoEmpresa.trim(),
        email: form.emailEmpresa.trim(),
        logotipo: null,
        moneda: null,
        pais: form.pais,
        plan_pago,
      });
      if (!empresaResult.success || !empresaResult.id_empresa) {
        throw new Error(empresaResult.message || "No se pudo registrar la empresa.");
      }

      const { usua, contra } = generateAdminCredentials(form.razonSocial);
      const usuarioResult = await addUsuarioLandingPublic({
        id_rol: 1,
        usua,
        contra,
        estado_usuario: 0,
        id_empresa: empresaResult.id_empresa,
        plan_pago,
      });
      if (!usuarioResult.success) {
        throw new Error(usuarioResult.message || "No se pudo crear el usuario administrador.");
      }

      return form;
    },
    onSuccess: (form) => {
      setEmailSubmitted(form.emailEmpresa);
      setStep("success");
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const [nombre, ...apellidoParts] = `${values.nombre} ${values.apellido}`.trim().split(" ");
      const result = await createPreference({
        items: [
          {
            id: `EMPRESA_${plan.id.toUpperCase()}_${Date.now()}`,
            title: `Plan ${plan.name}`,
            quantity: 1,
            unit_price: price,
            description: `Plan ${plan.name} — Horytek ERP (${period === "año" ? "anual" : "mensual"})`,
          },
        ],
        payer: {
          name: nombre || values.nombre,
          surname: apellidoParts.join(" ") || values.apellido,
          email: values.emailEmpresa,
          phone: { number: values.telefonoEmpresa },
        },
        external_reference: values.emailEmpresa,
        back_urls: {
          success: `${window.location.origin}/success`,
          failure: `${window.location.origin}/failure`,
          pending: `${window.location.origin}/pending`,
        },
        auto_return: "approved",
      });
      if (!result.success || !result.id) throw new Error(result.message || "No se pudo generar el enlace de pago.");
      return result.id;
    },
    onSuccess: (preferenceId) => {
      setPendingPaymentFlow("erp");
      window.location.href = `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${preferenceId}`;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    registerMutation.mutate(values);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="max-w-xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Registro de licencia
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.6rem,3.5vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Completa tu registro corporativo.
          </h1>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <section>
                  <h2 className="flex items-center gap-2 border-b border-border pb-4 text-[15px] font-semibold text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <User className="h-4 w-4 text-primary" aria-hidden />
                    </span>
                    Datos del administrador
                  </h2>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <FormField label="Nombre" htmlFor="nombre" error={errors.nombre}>
                      <Input id="nombre" value={values.nombre} onChange={(e) => set("nombre", e.target.value)} />
                    </FormField>
                    <FormField label="Apellido" htmlFor="apellido" error={errors.apellido}>
                      <Input id="apellido" value={values.apellido} onChange={(e) => set("apellido", e.target.value)} />
                    </FormField>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 border-b border-border pb-4 text-[15px] font-semibold text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" aria-hidden />
                    </span>
                    Datos de la empresa
                  </h2>
                  <div className="mt-5 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField label="RUC" htmlFor="ruc" error={errors.ruc}>
                        <Input
                          id="ruc"
                          inputMode="numeric"
                          maxLength={11}
                          placeholder="20XXXXXXXXX"
                          value={values.ruc}
                          onChange={(e) => set("ruc", e.target.value.replace(/\D/g, ""))}
                        />
                      </FormField>
                      <FormField label="Razón social" htmlFor="razonSocial" error={errors.razonSocial}>
                        <Input
                          id="razonSocial"
                          placeholder="Empresa S.A.C."
                          value={values.razonSocial}
                          onChange={(e) => set("razonSocial", e.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField label="Dirección fiscal" htmlFor="direccion" error={errors.direccion}>
                      <Input
                        id="direccion"
                        placeholder="Av. Principal 123, Lima"
                        value={values.direccion}
                        onChange={(e) => set("direccion", e.target.value)}
                      />
                    </FormField>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField label="Email corporativo" htmlFor="emailEmpresa" error={errors.emailEmpresa}>
                        <Input
                          id="emailEmpresa"
                          type="email"
                          placeholder="contacto@empresa.com"
                          value={values.emailEmpresa}
                          onChange={(e) => set("emailEmpresa", e.target.value)}
                        />
                      </FormField>
                      <FormField label="Teléfono / celular" htmlFor="telefonoEmpresa" error={errors.telefonoEmpresa}>
                        <Input
                          id="telefonoEmpresa"
                          placeholder="+51 999 999 999"
                          value={values.telefonoEmpresa}
                          onChange={(e) => set("telefonoEmpresa", e.target.value)}
                        />
                      </FormField>
                    </div>
                  </div>
                </section>

                <div className="flex items-start gap-2.5 border-t border-border pt-6">
                  <Checkbox
                    id="aceptaTerminos"
                    checked={values.aceptaTerminos}
                    onCheckedChange={(v) => set("aceptaTerminos", v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="aceptaTerminos" className="text-[13px] leading-relaxed text-muted-foreground">
                    He leído y acepto los{" "}
                    <Link to="/terminos" target="_blank" className="font-medium text-brand hover:underline">
                      términos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link to="/privacidad" target="_blank" className="font-medium text-brand hover:underline">
                      política de privacidad
                    </Link>{" "}
                    de Horytek.
                  </label>
                </div>
                {errors.aceptaTerminos && (
                  <p className="text-[12px] text-destructive">{errors.aceptaTerminos}</p>
                )}

                {submitError && (
                  <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                    {submitError}
                  </p>
                )}

                <Button type="submit" size="lg" disabled={registerMutation.isPending} className="w-full gap-2">
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando registro…
                    </>
                  ) : (
                    <>
                      Crear cuenta y continuar <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
                </div>
                <h2 className="mt-5 text-[1.4rem] font-semibold tracking-tight text-foreground">
                  ¡Bienvenido a bordo!
                </h2>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  Tu cuenta fue creada. Las credenciales de acceso llegarán a{" "}
                  <span className="font-medium text-foreground">{emailSubmitted}</span> apenas se confirme el pago.
                </p>

                <div className="mx-auto mt-8 max-w-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Siguiente paso
                  </p>
                  <Button
                    className="mt-4 w-full gap-2"
                    disabled={paymentMutation.isPending}
                    onClick={() => paymentMutation.mutate()}
                  >
                    {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Pagar con MercadoPago
                  </Button>
                  {paymentMutation.isError && (
                    <p className="mt-2 text-[12px] text-destructive">
                      {(paymentMutation.error as Error)?.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-secondary/30 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumen</p>
            <h3 className="mt-1 text-[1.3rem] font-semibold tracking-tight text-foreground">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="num text-[2rem] font-semibold tracking-[-0.02em] text-foreground">S/ {price}</span>
              <span className="text-[13px] text-muted-foreground">/ {period}</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{plan.description}</p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

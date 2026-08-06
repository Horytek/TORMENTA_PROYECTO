import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/shared/FormField";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { setPendingPaymentFlow } from "@/features/landing/utils/paymentFlow";
import { ECOMMERCE_PLANS } from "@/features/landing/data/landing.data";
import { createEcommercePreference, registerEcommerce } from "../api/ecommerce";

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function RegisterEcommercePage() {
  const [params] = useSearchParams();
  const planId = (params.get("plan") === "pro" ? "pro" : "starter") as "starter" | "pro";
  const plan = ECOMMERCE_PLANS.find((p) => p.id === planId) || ECOMMERCE_PLANS[0];

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idTienda, setIdTienda] = useState<number | null>(null);
  const [step, setStep] = useState<"form" | "pay">("form");

  const registerMut = useMutation({
    mutationFn: () =>
      registerEcommerce({
        nombre: nombre.trim(),
        slug: slug.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        plan: planId,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.message || "No se pudo registrar");
        return;
      }
      setIdTienda(res.data.id_tienda);
      setStep("pay");
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      setError(e.response?.data?.message || e.message || "Error");
    },
  });

  const payMut = useMutation({
    mutationFn: async () => {
      if (!idTienda) throw new Error("Sin tienda");
      const res = await createEcommercePreference({ id_tienda: idTienda, plan: planId });
      if (!res.success || !res.id) throw new Error(res.message || "No se pudo crear el pago");
      return res;
    },
    onSuccess: (res) => {
      setPendingPaymentFlow("ecommerce");
      const url =
        res.init_point ||
        `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${res.id}`;
      window.location.href = url;
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-stone-900">
      <MarketingHeader />
      <div className="max-w-lg mx-auto px-4 py-12">
        <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-2">Horytek · Ecommerce</p>
        <h1 className="text-3xl font-semibold tracking-tight">Activa tu tienda online</h1>
        <p className="text-stone-600 mt-2 text-sm">
          Plan <strong>{plan.name}</strong> — {plan.currency}
          {plan.price}/mes. Tras el pago recibirás usuario y contraseña por correo.
        </p>

        {step === "form" && (
          <form
            className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              if (!acepta) {
                setError("Debes aceptar los términos");
                return;
              }
              registerMut.mutate();
            }}
          >
            <FormField label="Nombre del negocio" error={!nombre ? undefined : undefined}>
              <Input
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
              />
            </FormField>
            <FormField label="Slug de la tienda (URL)" hint={`/tienda/${slug || "tu-tienda"}`}>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormField>
            <FormField label="Teléfono">
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </FormField>
            <label className="flex items-start gap-2 text-sm text-stone-600">
              <Checkbox checked={acepta} onCheckedChange={(v) => setAcepta(Boolean(v))} />
              Acepto los{" "}
              <Link to="/terminos" className="underline">
                términos
              </Link>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={registerMut.isPending}>
              {registerMut.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Continuar al pago
            </Button>
          </form>
        )}

        {step === "pay" && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <CheckCircle2 className="size-5" />
              <span className="font-medium">Cuenta creada</span>
            </div>
            <p className="text-sm text-stone-600">
              Completa el pago con Mercado Pago. Cuando se apruebe, te enviamos las credenciales a{" "}
              <strong>{email}</strong>.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={() => payMut.mutate()} disabled={payMut.isPending}>
              {payMut.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Pagar S/ {plan.price} con Mercado Pago
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

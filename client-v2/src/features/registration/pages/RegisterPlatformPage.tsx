import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { setPendingPaymentFlow } from "@/features/landing/utils/paymentFlow";
import { createPreference } from "@/features/account/api/billing";
import { getLandingModule } from "@/features/landing/modules/landingModules.registry";
import { getProductTheme } from "@/features/platform/ui/productThemes";
import { bootstrapTaxi } from "@/features/platform/api/taxi";
import { bootstrapDelivery } from "@/features/platform/api/delivery";
import { bootstrapFlotas } from "@/features/platform/api/flotas";
import { bootstrapAcademia } from "@/features/platform/api/academia";
import { bootstrapAgenda } from "@/features/platform/api/agenda";

const PLATFORM_PRODUCTS = new Set(["taxi", "delivery", "flotas", "academia", "agenda"]);

type BootstrapFn = (body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
  plan?: string;
}) => Promise<{ success: boolean; message?: string; data?: Record<string, unknown> }>;

const BOOTSTRAP: Record<string, BootstrapFn> = {
  taxi: bootstrapTaxi,
  delivery: bootstrapDelivery,
  flotas: bootstrapFlotas,
  academia: bootstrapAcademia,
  agenda: bootstrapAgenda,
};

const OWNER_KEY: Record<string, string> = {
  taxi: "id_operador",
  delivery: "id_operador",
  flotas: "id_empresa_flota",
  academia: "id_org",
  agenda: "id_profesional",
};

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function RegisterPlatformPage() {
  const [params] = useSearchParams();
  const product = (params.get("product") || "taxi").toLowerCase();
  const planId = params.get("plan") || "";

  const theme = getProductTheme(product);
  const module = getLandingModule(product);
  const plan = useMemo(() => {
    const plans = module?.pricing?.plans || [];
    return plans.find((p) => p.id === planId) || plans.find((p) => p.highlight) || plans[0];
  }, [module, planId]);

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validProduct = PLATFORM_PRODUCTS.has(product) && Boolean(BOOTSTRAP[product]);

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!validProduct) throw new Error("Producto no disponible para registro");
      if (!plan) throw new Error("Plan no encontrado");
      const fn = BOOTSTRAP[product];
      const boot = await fn({
        slug: slug.trim().toLowerCase(),
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        plan: plan.id,
      });
      if (!boot.success || !boot.data) {
        throw new Error(boot.message || "No se pudo registrar el operador");
      }
      const ownerKey = OWNER_KEY[product];
      const ownerId = Number(boot.data[ownerKey]);
      if (!Number.isFinite(ownerId) || ownerId <= 0) {
        throw new Error("Registro incompleto: falta id de operador");
      }

      const origin = window.location.origin;
      const pref = await createPreference({
        items: [
          {
            id: plan.id,
            title: `${theme.name} · ${plan.name}`,
            quantity: 1,
            unit_price: Number(plan.price) || 0,
            description: plan.description || theme.name,
          },
        ],
        payer: { email: email.trim(), name: nombre.trim() },
        external_reference: `${product}:${ownerId}`,
        back_urls: {
          success: `${origin}/success`,
          failure: `${origin}/failure`,
          pending: `${origin}/pending`,
        },
        auto_return: "approved",
      });
      if (!pref.success || !pref.id) {
        throw new Error(pref.message || "No se pudo crear el pago");
      }
      return pref.id;
    },
    onSuccess: (prefId) => {
      setPendingPaymentFlow("platform");
      window.location.href = `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${prefId}`;
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!validProduct) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.surface }}>
        <MarketingHeader />
        <main className="mx-auto max-w-lg px-6 py-16">
          <h1 className="text-2xl font-semibold">Producto no disponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este producto se registra desde el flujo ERP o no admite alta por plan.
          </p>
          <Link to="/soluciones" className="mt-6 inline-block text-sm underline">
            Ver soluciones
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.surface }}>
      <MarketingHeader
        productName={theme.name}
        accent={theme.accent}
        surface={theme.surface}
        loginHref={`/login?mode=${product}`}
        demoHref={`/?product=${product}`}
      />
      <main className="mx-auto max-w-lg px-6 py-12 md:py-16">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: theme.accent }}
        >
          Registro · {theme.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Crear operador</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Plan{" "}
          <strong className="text-foreground">{plan?.name || planId}</strong>
          {plan ? ` · S/ ${plan.price}/${plan.unit || "mes"}` : ""}. Tras el pago con MercadoPago
          tu cuenta queda activa.
        </p>

        <form
          className="mt-8 space-y-4 rounded-2xl border border-black/8 bg-white/90 p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            submitMut.mutate();
          }}
        >
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la operación</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              placeholder="Taxi Centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Código / slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              required
              placeholder="taxi-centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email del administrador</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full text-white"
            style={{ backgroundColor: theme.accent }}
            disabled={submitMut.isPending}
          >
            {submitMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirigiendo a MercadoPago…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Pagar y activar
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            ¿Ya pagaste?{" "}
            <Link to={`/login?mode=${product}`} className="underline-offset-4 hover:underline">
              Ingresar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

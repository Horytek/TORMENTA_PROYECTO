import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import {
  EVIDENCE_MODULES,
  FEATURE_GROUPS,
  FLOW_STEPS,
  type Mode,
} from "../data/landing.data";
import { useMode } from "../hooks/useMode";
import { InventoryRail } from "../components/InventoryRail";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { BlueprintSection } from "../components/BlueprintSection";
import { CaseStudy } from "../components/CaseStudy";
import { Pricing } from "../components/Pricing";
import { FAQ } from "../components/FAQ";
import { Footer } from "../components/Footer";
import { ScrollUpButton } from "../components/ScrollUpButton";
import { cn } from "@/lib/utils";

// IDs de sección en orden de aparición — los usa InventoryRail para los checkpoints.
const SECTION_IDS = [
  "hero",
  "evidencia",
  "producto",
  "rendimiento",
  "funciones",
  "flujo",
  "planes",
  "preguntas",
] as const;

export default function LandingPage() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const { mode, setMode } = useMode();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen w-full bg-background">
      <InventoryRail checkpoints={SECTION_IDS} />

      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-3 focus:py-1.5 focus:text-[12px] focus:text-background"
      >
        Saltar al contenido
      </a>

      <Header mode={mode} onModeChange={setMode} />

      <main>
        <Hero mode={mode} />
        <Evidence />
        <BlueprintSection mode={mode} />
        <CaseStudy mode={mode} />
        <Funciones />
        <Flujo />
        <Pricing mode={mode} />
        <FAQ mode={mode} />
        <CTA mode={mode} />
      </main>

      <Footer />
      <ScrollUpButton />
    </div>
  );
}

// ─── Evidencia (módulos strip) ──────────────────────────────────────────────

function Evidence() {
  return (
    <section
      id="evidencia"
      aria-label="Módulos del sistema"
      className="border-b border-border/60 bg-secondary/30"
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Módulos incluidos en cada plan
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {EVIDENCE_MODULES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[13px] font-medium text-foreground/80"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Funciones (3 grupos asimétricos) ──────────────────────────────────────

function Funciones() {
  return (
    <section
      id="funciones"
      className="border-b border-border/60 bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div className="md:sticky md:top-28 md:self-start">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Las funciones · 03
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              Tres oficios. Nueve piezas de software.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              Agrupadas por lo que necesitas hacer: vender, operar tu inventario o decidir con datos.
            </p>
          </div>

          <div className="space-y-12">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <header className="flex items-baseline justify-between border-b border-border pb-3">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    {group.title}
                  </h3>
                  <span className="num text-[11px] font-mono text-muted-foreground">
                    {String(group.items.length).padStart(2, "0")} ítems
                  </span>
                </header>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  {group.blurb}
                </p>

                <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((f) => {
                    const Icon = f.icon;
                    return (
                      <li key={f.name}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <h4 className="mt-3 text-[14px] font-semibold tracking-tight text-foreground">
                          {f.name}
                        </h4>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                          {f.body}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Flujo (5 pasos) ──────────────────────────────────────────────────────

function Flujo() {
  return (
    <section
      id="flujo"
      className="border-b border-border/60 bg-secondary/20 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            El flujo · 02
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            De abrir la tienda a cerrar el día — sin cambiar de sistema.
          </h2>
        </div>

        <ol className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-5">
          {FLOW_STEPS.map((step) => (
            <li key={step.n} className="relative">
              <span className="num text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Paso {step.n}
              </span>
              <span className="num mt-3 block text-4xl font-semibold leading-none tracking-[-0.02em] text-foreground/20">
                {step.n}
              </span>
              <h3 className="num mt-3 text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── CTA final ─────────────────────────────────────────────────────────────

function CTA({ mode }: { mode: Mode }) {
  const isPocket = mode === "pocket";
  const isEcommerce = mode === "ecommerce";

  return (
    <section
      className={cn(
        "py-20 text-primary-foreground md:py-24",
        isPocket ? "bg-amber-600" : isEcommerce ? "bg-teal-800" : "bg-primary",
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              {isPocket
                ? "Lleva tu tienda en el bolsillo."
                : isEcommerce
                  ? "Publica tu tienda online hoy."
                  : "Empieza a gestionar tu tienda hoy."}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-primary-foreground/80">
              {isPocket
                ? "Empieza con el Plan Diario por S/ 5 y prueba Pocket sin compromiso. Actívalo cuando lo necesites."
                : isEcommerce
                  ? "Elige Starter o Pro, paga con Mercado Pago y recibe tus credenciales por correo. Tus clientes entran por /tienda/tu-slug."
                  : "Accede con tu cuenta o pide a tu administrador que active Horytek en tu empresa. La facturación SUNAT se configura en menos de una hora."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" variant="secondary" className="gap-2 px-5">
              <Link to={isEcommerce ? "/login?mode=ecommerce" : "/login"}>
                Iniciar sesión <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href="#planes">Ver planes</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
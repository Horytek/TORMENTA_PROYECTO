import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Palette,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ATELIER_ACCENT,
  ATELIER_COPY,
  ATELIER_ROUTES,
} from "@/features/atelier";
import { PEN_PER_USD, formatFromPrice } from "@/features/atelier/helpers";
import { creatorName, type AtelierCreator } from "@/features/atelier/types";
import type { LandingPricingPlan, LandingProductModule } from "../../../modules/landingModule.types";
import { AtelierVideoSection } from "@/features/atelier/video/AtelierVideoSection";
import "@/features/atelier/styles/atelier.css";

const ACCENT = ATELIER_ACCENT;

/** Nunca pintar S/ {plan.price} si unit es fee: esa cifra no es el precio de la card. */
function AtelierPlanAmount({ plan }: { plan: LandingPricingPlan }) {
  const unitIsFee = /fee/i.test(plan.unit);
  const isCreator = plan.id === "creador" || unitIsFee;
  if (isCreator) {
    const usd = plan.price > 0 && !unitIsFee ? plan.price : 9;
    const pen = Math.round(usd * PEN_PER_USD);
    return (
      <div>
        <div className="flex items-baseline gap-1">
          <span className="num text-[2.5rem] font-semibold tracking-[-0.02em] text-foreground">
            US$ {usd}
          </span>
          <span className="text-[13px] text-muted-foreground">/ mes</span>
        </div>
        <p className="num mt-1 text-[12px] text-muted-foreground">~S/ {pen} · Polar</p>
      </div>
    );
  }
  if (plan.id === "cliente" || plan.price === 0 || plan.unit === "gratis") {
    return (
      <div className="flex items-baseline gap-1">
        <span className="num text-[2.5rem] font-semibold tracking-[-0.02em] text-foreground">
          Gratis
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="num text-[2.5rem] font-semibold tracking-[-0.02em] text-foreground">
        {plan.price}
      </span>
      {plan.unit ? <span className="text-[13px] text-muted-foreground">/ {plan.unit}</span> : null}
    </div>
  );
}

export function AtelierEditorialHero() {
  return (
    <section id="hero" className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:pb-28 lg:pt-28">
        <div className="flex flex-col">
          <p className="text-[13px] font-medium text-muted-foreground">
            ¿Quieres un dibujo a medida, no un archivo de catálogo?
          </p>
          <p
            className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Horytek Atelier
          </p>
          <h1 className="mt-3 text-balance text-[clamp(2.4rem,5.2vw,3.85rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-foreground">
            {ATELIER_COPY.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-muted-foreground">
            {ATELIER_COPY.conceptLead} {ATELIER_COPY.conceptBody}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 px-5 text-white hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              <Link to={ATELIER_ROUTES.commission}>
                {ATELIER_COPY.ctaCommission} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to={ATELIER_ROUTES.discover}>{ATELIER_COPY.ctaDiscover}</Link>
            </Button>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Brief privado · Cotización del artista · Pago con Mercado Pago
          </p>
        </div>
        <AtelierHeroVisual />
      </div>
    </section>
  );
}

function AtelierHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[470px] pb-12 lg:ml-auto lg:mr-0 lg:pt-5">
      <div
        aria-hidden
        className="absolute inset-6 rounded-[2rem] blur-3xl"
        style={{ backgroundColor: `${ACCENT}1a` }}
      />
      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_-28px_hsl(var(--foreground)/0.35)]">
        <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Encargo #184</p>
              <p className="text-[9px] text-muted-foreground">Private commission · ejemplo</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: ACCENT }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
            En proceso
          </span>
        </header>
        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            De la idea a la obra
          </p>
          <div className="mt-4 space-y-2.5">
            <HeroRow icon={FileText} title="El brief quedó en el tablero" detail="Estilo, referencias privadas, presupuesto" chip="Idea" />
            <HeroRow icon={MessageSquare} title="El artista envió una propuesta" detail="Precio, plazos y revisiones" chip="Cotiza" />
            <HeroRow icon={ImageIcon} title="La obra está lista para descargar" detail="Original firmado · archivo privado" chip="Obra" />
          </div>
        </div>
      </article>
      <div className="absolute -bottom-1 left-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:-left-7">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Mercado Pago</p>
            <p className="text-[12px] font-semibold text-foreground">El cobro confirma el encargo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroRow({
  icon: Icon,
  title,
  detail,
  chip,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  chip: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-foreground">{title}</p>
        <p className="truncate text-[9px] text-muted-foreground">{detail}</p>
      </div>
      <span
        className="ml-auto hidden rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
        style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
      >
        {chip}
      </span>
    </div>
  );
}

const TRUST_CLAIMS = [
  { label: "Portafolio", body: "Ves el trazo del artista antes de encargar." },
  { label: "Cotización", body: "El artista propone precio, plazos y revisiones." },
  { label: "Mercado Pago", body: "Pagas el dibujo cuando aceptas la propuesta." },
  { label: "Original", body: "Descargas el archivo cuando la obra está lista." },
] as const;

export function AtelierTrust() {
  return (
    <section id="confianza" aria-label="Por qué encargar en Atelier" className="border-b border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Encargos de ilustración
        </p>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_CLAIMS.map((item) => (
            <li key={item.label} className="text-center sm:text-left">
              <p className="text-[15px] font-semibold tracking-tight text-foreground">{item.label}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    icon: Search,
    title: "Descubre al artista",
    body: "Filtra por estilo y abre el estudio. El portafolio muestra el trazo, no un catálogo de stock.",
  },
  {
    icon: PenLine,
    title: "Cuentas la idea",
    body: "Estilo, referencias privadas y presupuesto. El brief queda en el tablero o se dirige a un artista.",
  },
  {
    icon: Wallet,
    title: "Confirmas y pagas",
    body: "Aceptas una propuesta. Mercado Pago cobra el dibujo. El encargo queda confirmado.",
  },
  {
    icon: Palette,
    title: "Llega la obra",
    body: "Boceto, ajustes y entrega. Descargas el original. El artista firma el trabajo.",
  },
] as const;

export function AtelierPillars() {
  return (
    <section id="beneficios" className="border-b border-border/60 bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Qué ganas
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Un artista, un brief, un encargo.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Pensado para pedir un dibujo a medida — no para comprar una lámina de catálogo.
          </p>
        </div>
        <ul className="mt-14 grid gap-10 sm:grid-cols-2">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li key={pillar.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-foreground">{pillar.title}</h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">{pillar.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function AtelierArtistsStrip({ creators }: { creators: AtelierCreator[] }) {
  const list = creators.slice(0, 8);
  return (
    <section
      id="artistas"
      className="relative overflow-hidden border-b border-border/60 py-16 md:py-20"
      style={{
        background: "linear-gradient(105deg, #f8fafc 0%, #fdf2f8 45%, #f8fafc 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Estudios
            </span>
            <h2 className="mt-2 text-balance text-[clamp(1.45rem,3vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
              Artistas que toman encargos
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Elige un estudio y encarga directo, o publica un brief abierto al tablero.
            </p>
          </div>
          <Link
            to={ATELIER_ROUTES.artists}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {ATELIER_COPY.artists} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {list.length ? (
          <div className="mt-8 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((c) => (
              <Link
                key={c.slug}
                to={ATELIER_ROUTES.artist(c.slug)}
                className="group flex min-w-[11rem] flex-col justify-between rounded-2xl border border-black/8 bg-white/90 px-4 py-4 shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ borderTopWidth: 3, borderTopColor: ACCENT }}
              >
                <p className="text-[14px] font-semibold text-foreground">{creatorName(c)}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-black/50">
                  {formatFromPrice(c.precio_desde) ?? c.estilos ?? "Toma encargos"}
                </p>
                <span className="mt-3 text-[11px] font-semibold" style={{ color: ACCENT }}>
                  Ver estudio →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[14px] text-muted-foreground">
            Los artistas aparecen aquí cuando publican su estudio.
          </p>
        )}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    icon: PenLine,
    title: "Cuentas la idea",
    body: "Estilo, referencias privadas, presupuesto. El brief queda en el tablero o se dirige a un artista.",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "El artista propone",
    body: "Precio, plazos y revisiones. Tú aceptas una propuesta. El encargo se confirma.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Llega la obra",
    body: "Boceto, ajustes, entrega. Descargas el original. El artista firma el trabajo.",
  },
] as const;

export function AtelierHowItWorks() {
  return (
    <section id="producto" className="relative overflow-hidden border-b border-border/60 bg-secondary/25 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${ACCENT}1a` }}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
            Así se encarga
          </span>
          <h2 className="mt-3 text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            De la idea a la obra
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Sin cotizar por chat suelto. El brief, la propuesta y la entrega viven en el mismo encargo.
          </p>
        </div>
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
          <ol className="space-y-5">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4 rounded-2xl border border-transparent p-4">
                <span className="num mt-1 text-[11px] font-semibold" style={{ color: ACCENT }}>
                  {step.n}
                </span>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
                >
                  <step.icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <AtelierJourneyPreview />
        </div>
      </div>
    </section>
  );
}

function AtelierJourneyPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-8 sm:px-8">
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_22px_60px_-30px_hsl(var(--foreground)/0.35)]">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-2 flex flex-1 items-center rounded-md border border-border bg-background px-3 py-1.5 text-[9px] text-muted-foreground">
            atelier · encargo
          </div>
        </div>
        <div className="grid sm:grid-cols-[1fr_0.9fr]">
          <div className="border-b border-border p-5 sm:border-b-0 sm:border-r sm:p-6">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
              Brief
            </span>
            <div className="mt-4 rounded-xl bg-secondary/50 p-4">
              <div className="h-28 rounded-lg bg-secondary" />
              <p className="mt-3 text-[12px] font-semibold text-foreground">Retrato a tinta</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Referencias privadas · 2 revisiones</p>
            </div>
          </div>
          <div className="flex flex-col p-5 sm:p-6">
            <p className="text-[11px] font-semibold text-foreground">Propuesta del artista</p>
            <div className="mt-5 space-y-3 text-[10px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Plazo</span>
                <span>8 días</span>
              </div>
              <div className="border-t border-dashed border-border pt-3">
                <div className="flex justify-between text-[12px] font-semibold text-foreground">
                  <span>Aceptar</span>
                  <span>S/ 180</span>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border p-3" style={{ borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}0d` }}>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" style={{ color: ACCENT }} aria-hidden />
                <span className="text-[10px] font-semibold text-foreground">Pagar con Mercado Pago</span>
              </div>
              <p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">
                El pago confirma el encargo. La comisión la calcula el servidor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AtelierProof() {
  return (
    <section id="rendimiento" className="border-b border-border/60 bg-background py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
            El trazo
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.9rem,3.8vw,2.8rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-foreground">
            {ATELIER_COPY.seeIdeaBecome}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Sin sonido. El trazo cuenta la historia. Una idea, una mano, una obra — no un carrito de productos.
          </p>
        </div>
        <div className="atelier !min-h-0 overflow-hidden rounded-2xl border border-border !bg-transparent [background-image:none] [&::before]:hidden">
          <AtelierVideoSection />
        </div>
      </div>
    </section>
  );
}

export function AtelierPricingTwo({ module }: { module: LandingProductModule }) {
  const { pricing } = module;
  return (
    <section id="planes" className="border-b border-border/60 bg-secondary/20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {pricing.eyebrow || "Planes · Atelier"}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {pricing.title}
          </h2>
          <p className="mt-3 text-[14px] text-muted-foreground">{pricing.body}</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-5 lg:grid-cols-2">
          {pricing.plans.map((plan) => {
            const highlight = Boolean(plan.highlight);
            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-7",
                  highlight ? "lg:-mt-3" : "border-border",
                )}
                style={
                  highlight
                    ? { borderColor: ACCENT, boxShadow: `0 2px 0 0 ${ACCENT}` }
                    : undefined
                }
              >
                {highlight ? (
                  <span
                    className="absolute -top-2.5 left-7 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Artista
                  </span>
                ) : null}
                <header>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-2 min-h-[2.5rem] text-[13px] leading-snug text-muted-foreground">
                    {plan.description}
                  </p>
                </header>
                <div className="mt-6 border-t border-dashed border-border pt-5">
                  <AtelierPlanAmount plan={plan} />
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn("mt-7", highlight && "text-white hover:opacity-90")}
                  variant={highlight ? "default" : "outline"}
                  style={highlight ? { backgroundColor: ACCENT } : undefined}
                >
                  <Link to={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AtelierFaq({ module }: { module: LandingProductModule }) {
  const faqs = module.copy.faqs;
  return (
    <section id="preguntas" className="border-b border-border/60 bg-background py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Preguntas frecuentes
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Lo que preguntan antes de encargar
          </h2>
        </div>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium text-foreground">
                <span>{item.q}</span>
                <Plus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AtelierCtaBand() {
  return (
    <section id="cta" className="py-20 text-white md:py-24" style={{ backgroundColor: ACCENT }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
              {ATELIER_COPY.taglineFull}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/80">
              Escribe el brief o entra a un estudio. El encargo vive aquí hasta la obra.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" variant="secondary" className="gap-2 px-5">
              <Link to={ATELIER_ROUTES.commission}>
                {ATELIER_COPY.ctaCommission} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={ATELIER_ROUTES.login}>{ATELIER_COPY.login}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

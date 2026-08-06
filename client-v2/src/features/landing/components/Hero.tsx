import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe2,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";
import {
  HERO_BADGES,
  HERO_VALUE_POINTS,
  POCKET_HERO,
  ECOMMERCE_HERO,
  SALES_WHATSAPP_URL,
  TAG_COLORS,
  STANDARD_TRUST_INDICATORS,
  type Mode,
} from "../data/landing.data";
import { cn } from "@/lib/utils";

interface HeroProps {
  mode: Mode;
}

export function Hero({ mode }: HeroProps) {
  return (
    <section
      id="hero"
      className={cn(
        "relative overflow-hidden border-b border-border/60 transition-colors",
        mode === "pocket"
          ? "bg-amber-500/[0.04]"
          : mode === "ecommerce"
            ? "bg-teal-700/[0.04]"
            : "bg-background",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {mode === "standard" ? (
        <HeroStandard />
      ) : mode === "pocket" ? (
        <HeroPocket />
      ) : (
        <HeroEcommerce />
      )}
    </section>
  );
}

// ─── Standard ──────────────────────────────────────────────────────────────

function HeroStandard() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:pb-28 lg:pt-28">
      <div className="flex flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/25 bg-brand/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Para emprendedores que quieren crecer
        </span>

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {HERO_BADGES.map((b) => (
            <span
              key={b}
              className="num rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              {b}
            </span>
          ))}
        </div>

        <h1 className="mt-6 text-balance text-[clamp(2.55rem,5.5vw,4.15rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-foreground">
          Tu tienda física y online,{
          " "}<span className="text-brand">en un solo lugar.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-muted-foreground">
          Cobra en tu local o por internet, controla qué productos te quedan y
          entrega boletas o facturas desde el mismo lugar.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2 px-5">
            <a href={SALES_WHATSAPP_URL} target="_blank" rel="noreferrer">
              Solicitar una demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <a href="#producto">Ver cómo compra tu cliente</a>
          </Button>
        </div>

        {/* Trust indicators */}
        <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {STANDARD_TRUST_INDICATORS.map((t) => (
            <li key={t.label} className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
              {t.label}
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-3">
          {HERO_VALUE_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg bg-secondary/45 p-3.5">
              <Icon className="h-4 w-4 text-brand" aria-hidden />
              <dt className="mt-2 text-[12px] font-semibold text-foreground">{title}</dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </div>

      <HeroVisualStandard />
    </div>
  );
}

// ─── Pocket ────────────────────────────────────────────────────────────────

function HeroPocket() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-28 lg:pt-32">
      <div className="flex flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {POCKET_HERO.badge}
        </span>

        <h1 className="mt-6 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
          {POCKET_HERO.titleLead}{" "}
          <span className="text-amber-600">{POCKET_HERO.titleAccent}</span>
        </h1>

        <p className="mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground">
          {POCKET_HERO.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className="gap-2 bg-amber-600 px-5 text-white hover:bg-amber-700"
          >
            <Link to="/login">
              Probar Pocket <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="gap-2 border-amber-500/40 hover:bg-amber-500/10"
          >
            <a href="#planes">Ver planes Pocket</a>
          </Button>
        </div>

        <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {POCKET_HERO.trustIndicators.map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : "bg-purple-500",
                )}
              />
              {t}
            </li>
          ))}
        </ul>

        <dl className="num mt-10 grid grid-cols-2 gap-6 border-t border-amber-500/20 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tiempo de carga
            </dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              &lt;1s
            </dd>
          </div>
          {/* No se anuncia "funciona offline": no hay service worker ni cola de
              sincronización. Lo que sí es cierto es que el celular y la tienda
              miran el mismo inventario. */}
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Inventario
            </dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              En vivo
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Sin contrato
            </dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Diario
            </dd>
          </div>
        </dl>
      </div>

      <HeroVisualPocket />
    </div>
  );
}

// ─── Visuales ──────────────────────────────────────────────────────────────

function HeroVisualStandard() {
  return (
    <div className="relative mx-auto w-full max-w-[470px] pb-12 lg:ml-auto lg:mr-0 lg:pt-5">
      <div aria-hidden className="absolute inset-6 rounded-[2rem] bg-brand/10 blur-3xl" />

      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_-28px_hsl(var(--foreground)/0.35)]">
        <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Mi negocio</p>
              <p className="text-[9px] text-muted-foreground">Vista general · ejemplo</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Todo conectado
          </span>
        </header>

        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tus canales de venta
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ChannelCard icon={ShoppingBag} label="Tienda física" detail="Caja + comprobantes" tone="brand" />
            <ChannelCard icon={Globe2} label="Tienda online" detail="Catálogo + cobro" tone="emerald" />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Un solo inventario
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2.5">
            <OperationRow
              icon={CreditCard}
              title="Compra por internet confirmada"
              detail="Pago recibido · pedido listo para preparar"
              chip="Online"
            />
            <OperationRow
              icon={PackageCheck}
              title="Producto reservado"
              detail="La cantidad disponible se actualizó"
              chip="Listo"
            />
          </div>
        </div>
      </article>

      <div className="absolute -bottom-1 left-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:-left-7">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Venta completada</p>
            <p className="text-[12px] font-semibold text-foreground">Sin duplicar trabajo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function ChannelCard({
  icon: Icon,
  label,
  detail,
  tone,
}: {
  icon: typeof ShoppingBag;
  label: string;
  detail: string;
  tone: "brand" | "emerald";
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/35 p-3.5">
      <Icon className={cn("h-4 w-4", tone === "brand" ? "text-brand" : "text-emerald-600")} aria-hidden />
      <p className="mt-3 text-[12px] font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function OperationRow({
  icon: Icon,
  title,
  detail,
  chip,
}: {
  icon: typeof CreditCard;
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
      <span className="ml-auto hidden rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-emerald-700 sm:inline-flex">
        {chip}
      </span>
    </div>
  );
}

function HeroVisualPocket() {
  return (
    <div className="relative mx-auto flex w-full max-w-sm justify-center lg:justify-end">
      {/* Phone frame */}
      <div className="relative mt-16 h-[480px] w-[260px] rounded-[36px] border-[10px] border-foreground/90 bg-background shadow-[0_10px_40px_-10px_hsl(var(--foreground)/0.35)]">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-foreground/90" />

        <div className="flex h-full flex-col p-4">
          {/* Header */}
          <div className="mt-4 flex items-center justify-between">
            <span className="num text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Pocket · POS
            </span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500" />
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Venta actual
          </p>
          <p className="num mt-1 text-[28px] font-semibold tracking-tight">
            S/ 89.90
          </p>

          <ul className="num mt-4 space-y-1.5 text-[12px]">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Polo Oversize · M</span>
              <span>S/ 49.90</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Polera Lisa · L</span>
              <span>S/ 40.00</span>
            </li>
          </ul>

          <div className="my-3 border-t border-dashed border-border" />

          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Pago mixto
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
            <span className="rounded-md border border-border bg-secondary px-2 py-1 text-center">
              Yape
            </span>
            <span className="rounded-md border border-border bg-secondary px-2 py-1 text-center">
              Efec.
            </span>
            <span className="rounded-md border border-border bg-secondary px-2 py-1 text-center">
              Tarj.
            </span>
          </div>

          <button
            type="button"
            className="num mt-auto rounded-xl bg-amber-600 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm"
          >
            Cobrar S/ 89.90
          </button>
        </div>
      </div>

      {/* Floating stat — stock por variante */}
      <div className="num absolute -right-2 top-24 hidden rounded-lg border border-border bg-card px-3 py-2 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.18)] sm:block">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Stock por talla
            </p>
            <p className="text-[13px] font-semibold tracking-tight">Al día</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function HeroEcommerce() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pb-28 lg:pt-32">
      <div className="flex flex-col">
        <span className="num w-fit rounded-full border border-teal-700/30 bg-teal-700/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-teal-800">
          {ECOMMERCE_HERO.badge}
        </span>
        <h1 className="mt-6 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
          {ECOMMERCE_HERO.title}
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          {ECOMMERCE_HERO.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2 bg-teal-700 hover:bg-teal-800">
            <a href="#planes">
              {ECOMMERCE_HERO.cta} <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login?mode=ecommerce">Ya tengo cuenta</Link>
          </Button>
        </div>
        <ul className="mt-10 grid gap-3 text-[13px] text-muted-foreground sm:grid-cols-2">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Un enlace fácil para compartir</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Fotos que cargan rápido</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Pagos directos a tu cuenta</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-700" /> Productos y ventas protegidos</li>
        </ul>
      </div>
      <div className="relative">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-stone-400">
            <span>Horytek · Tag</span>
            <span>POL-0432</span>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-wider text-stone-400">Producto · Tienda de ropa</p>
          <h3 className="text-2xl font-semibold tracking-tight">Polo Oversize</h3>
          <p className="text-sm text-stone-500 mt-1">Algodón peinado 24/1 · 180 g</p>
          <div className="mt-4">
            <p className="text-[10px] uppercase text-stone-400 mb-2">Tonalidades</p>
            <SwatchStrip colors={TAG_COLORS.slice(0, 5)} />
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase text-stone-400 mb-2">Curva de tallas</p>
            <SizeCurve
              sizes={[
                { label: "S" },
                { label: "M" },
                { label: "L" },
                { label: "XL", available: false },
              ]}
            />
          </div>
          <div className="mt-5 flex justify-between border-t border-dashed border-stone-200 pt-4">
            <div>
              <p className="text-[10px] uppercase text-stone-400">Stock</p>
              <p className="text-xl font-semibold">128 uds</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-stone-400">Precio</p>
              <p className="text-xl font-semibold text-teal-800">S/ 49.90</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-2 -top-3 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <TrendingUp className="size-3.5" />
            </span>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-stone-400">Ventas semanales</p>
              <p className="text-sm font-semibold">S/ 12,430</p>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-3 -left-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <AlertTriangle className="size-3.5" />
            </span>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-stone-400">Stock crítico</p>
              <p className="text-sm font-semibold">5 items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

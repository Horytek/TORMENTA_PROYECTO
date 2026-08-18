import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";
import {
  POCKET_HERO,
  ECOMMERCE_HERO,
  SALES_WHATSAPP_URL,
  TAG_COLORS,
  type Mode,
} from "../data/landing.data";
import { cn } from "@/lib/utils";
import { HeroOrbit } from "./HeroOrbit";

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
        <p className="text-[13px] font-medium text-muted-foreground">
          ¿Vendes productos y necesitas orden en caja, stock y SUNAT?
        </p>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
          Horytek
        </p>

        <h1 className="mt-3 text-[clamp(2.3rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.035em] text-foreground">
          <span className="block font-semibold">Controla tu inventario</span>
          <span className="block font-bold text-[hsl(var(--lp-accent))]">
            y vende por talla y color
          </span>
          <span className="block font-semibold">sin llevar dos sistemas.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-muted-foreground">
          Emite boleta y factura electrónica, cobra en tu local o online, y mira
          el negocio completo — con acompañamiento local.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2 px-5">
            <Link to="/soluciones">
              Probar soluciones demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <a href="#planes">Ver planes</a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="gap-2">
            <a href={SALES_WHATSAPP_URL} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Demos con datos seed · Soporte en Perú · Facturación SUNAT integrada
        </p>
      </div>

      <HeroOrbit />
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
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
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

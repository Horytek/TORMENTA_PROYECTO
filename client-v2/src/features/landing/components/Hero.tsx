import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";
import {
  HERO_BADGES,
  HERO_STATS,
  POCKET_HERO,
  SECTORS,
  STANDARD_TRUST_INDICATORS,
  TAG_COLORS,
  type Mode,
  type Sector,
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
        mode === "pocket" ? "bg-amber-500/[0.04]" : "bg-background",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {mode === "standard" ? <HeroStandard /> : <HeroPocket />}
    </section>
  );
}

// ─── Standard ──────────────────────────────────────────────────────────────

function HeroStandard() {
  const [activeSector, setActiveSector] = useState<Sector["id"]>("retail");
  const current = SECTORS.find((s) => s.id === activeSector) ?? SECTORS[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-28 lg:pt-32">
      <div className="flex flex-col">
        {/* Selector de sectores */}
        <div
          role="tablist"
          aria-label="Sector de tu negocio"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-secondary/50 p-1 backdrop-blur"
        >
          {SECTORS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={activeSector === s.id}
              onClick={() => setActiveSector(s.id)}
              className={cn(
                "num rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
                activeSector === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          {HERO_BADGES.map((b) => (
            <span
              key={b}
              className="num rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              {b}
            </span>
          ))}
        </div>

        {/* El titular nombra el rubro: "control total" lo promete cualquier ERP,
            "cuánto ganas por prenda" solo lo puede decir uno que entiende ropa. */}
        <h1 className="mt-6 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
          Sabe cuánto{" "}
          <span className={current.textClass}>ganas</span>
          <br />
          por cada prenda.
        </h1>

        <p
          key={current.id}
          className="mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground"
        >
          {current.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2 px-5">
            <Link to="/login">
              Iniciar sesión <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <a href="#planes">Ver planes</a>
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

        {/* Stats inline */}
        <dl className="num mt-10 grid grid-cols-3 gap-6 border-t border-border/70 pt-6">
          {HERO_STATS.map((s) => (
            <div key={s.label}>
              <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <HeroVisualStandard sector={current} />
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

function HeroVisualStandard({ sector }: { sector: Sector }) {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:ml-auto lg:mr-0">
      {/* Hilo + ojal */}
      <div aria-hidden className="absolute left-1/2 top-0 h-12 w-px -translate-x-1/2 bg-border" />
      <div
        aria-hidden
        className="absolute left-1/2 top-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background"
      />

      <article className="relative mt-16 overflow-hidden rounded-[10px] border border-border bg-card text-card-foreground shadow-[0_1px_0_0_hsl(var(--border))]">
        <header className="flex items-center justify-between border-b border-dashed border-border px-5 py-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Horytek · Tag
          </span>
          <span className="num text-[10px] font-mono text-muted-foreground">POL-0432</span>
        </header>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Producto · {sector.label}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
              Polo Oversize
            </h2>
            <p className="num mt-0.5 text-xs text-muted-foreground">
              Algodón peinado 24/1 · 180 g
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Tonalidades
            </p>
            <SwatchStrip colors={TAG_COLORS} size="md" className="mt-2" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Curva de tallas
            </p>
            <SizeCurve
              className="mt-2"
              sizes={[
                { label: "S", available: true },
                { label: "M", available: true },
                { label: "L", available: true },
                { label: "XL", available: false },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Stock
              </p>
              <p className="num mt-1 text-xl font-semibold tracking-tight">
                <span className="text-foreground">128</span>
                <span className="ml-1 text-xs font-medium text-muted-foreground">uds</span>
              </p>
              <p className="num mt-0.5 text-[11px] text-muted-foreground">
                Almacén central
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Precio
              </p>
              <p className="num mt-1 text-xl font-semibold tracking-tight">S/ 49.90</p>
              <p className="num mt-0.5 text-[11px] text-muted-foreground">inc. IGV</p>
            </div>
          </div>
        </div>

        <footer className="border-t border-dashed border-border bg-secondary/50 px-5 py-4">
          <BarcodePattern value="POL-0432-S-L" />
          <p className="num mt-2 text-center text-[9px] tracking-[0.3em] text-muted-foreground">
            POL · 0432 · S · L
          </p>
        </footer>
      </article>

      {/* Floating cards estáticos — sin Framer */}
      <div className="num pointer-events-none absolute -right-4 top-24 hidden rounded-lg border border-border bg-card px-3 py-2 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.18)] sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Ventas semanales
            </p>
            <p className="text-[13px] font-semibold tracking-tight">S/ 12,430</p>
          </div>
        </div>
      </div>

      <div className="num pointer-events-none absolute -left-6 bottom-12 hidden rounded-lg border border-border bg-card px-3 py-2 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.18)] sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Stock crítico
            </p>
            <p className="text-[13px] font-semibold tracking-tight">5 items</p>
          </div>
        </div>
      </div>
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

/** Barcode SVG estático — sin JsBarcode para no penalizar LCP del landing. */
function BarcodePattern({ value }: { value: string }) {
  const bars = value
    .split("")
    .map((c, i) => ((c.charCodeAt(0) * (i + 1)) % 4) + 1);

  return (
    <svg
      viewBox="0 0 200 40"
      className="h-8 w-full"
      role="img"
      aria-label={`Código de barras ${value}`}
    >
      {bars.map((w, i) => {
        const x = bars.slice(0, i).reduce((a, b) => a + b + 1, 0);
        return (
          <rect
            key={i}
            x={x}
            y={0}
            width={w}
            height={40}
            fill="currentColor"
            className="text-foreground"
          />
        );
      })}
    </svg>
  );
}
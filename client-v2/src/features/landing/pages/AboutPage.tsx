import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import {
  ABOUT_MISSION,
  ABOUT_VALUE_TILES,
  ABOUT_WHAT_IS,
  ABOUT_VALUES,
  ABOUT_STATS,
} from "../data/landing.data";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Hero */}
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Sobre nosotros
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Innovando para el futuro empresarial.
          </h1>
        </div>

        {/* Nuestra empresa */}
        <section className="mt-16 grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
              {ABOUT_MISSION.title}
            </h2>
            {ABOUT_MISSION.body.map((p) => (
              <p key={p} className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
          <blockquote className="rounded-xl border border-border bg-secondary/30 p-6 text-[14px] font-medium leading-relaxed text-foreground">
            “{ABOUT_MISSION.quote}”
          </blockquote>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ABOUT_VALUE_TILES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-xl border border-border bg-card p-5">
                <Icon className="h-4 w-4 text-brand" aria-hidden />
                <h3 className="mt-3 text-[13.5px] font-semibold text-foreground">{v.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            );
          })}
        </div>

        {/* Qué es Horytek */}
        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            ¿Qué es Horytek?
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {ABOUT_WHAT_IS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-xl border border-border bg-card p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Valores */}
        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Nuestros valores
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {ABOUT_VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">{v.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{v.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats + CTA */}
        <section className="mt-20 rounded-2xl border border-border bg-secondary/30 p-8 md:p-10">
          <div className="grid gap-6 sm:grid-cols-3">
            {ABOUT_STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center sm:text-left">
                  <Icon className="mx-auto h-4 w-4 text-muted-foreground sm:mx-0" aria-hidden />
                  <p className="num mt-2 text-[2rem] font-semibold tracking-[-0.02em] text-foreground">
                    {s.value}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-[14px] font-medium text-foreground">
              El futuro de tu empresa comienza hoy.
            </p>
            <Link
              to="/#planes"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver planes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

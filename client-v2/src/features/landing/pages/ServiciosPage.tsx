import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import {
  SERVICIOS_MODULES,
  SERVICIOS_BENEFITS,
  SERVICIOS_ADICIONALES,
  SERVICIOS_SECTORES,
  LEGAL_CONTACT,
} from "../data/landing.data";

export default function ServiciosPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Hero */}
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Servicios
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Control total de tu negocio.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Ventas, inventario, facturación electrónica y contabilidad en un solo sistema — sin
            hojas de cálculo ni sistemas sueltos que no se hablan entre sí.
          </p>
        </div>

        {/* Módulos */}
        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Módulos del sistema
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <article key={m.title} className="rounded-xl border border-border bg-card p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-[14px] font-semibold tracking-tight text-foreground">
                    {m.title}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {m.items.map((item) => (
                      <li key={item} className="text-[12.5px] leading-relaxed text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {/* Beneficios clave */}
        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Beneficios clave
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">{b.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{b.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Servicios adicionales */}
        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Servicios adicionales
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICIOS_ADICIONALES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-xl border border-border bg-card p-5">
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  <h3 className="mt-3 text-[13.5px] font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sectores atendidos */}
        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Sectores que atendemos
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {SERVICIOS_SECTORES.map((s) => {
              const Icon = s.icon;
              return (
                <span
                  key={s.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[13px] font-medium text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> {s.label}
                </span>
              );
            })}
          </div>
        </section>

        {/* CTA + contacto */}
        <section className="mt-20 rounded-2xl border border-border bg-secondary/30 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[clamp(1.4rem,2.5vw,1.9rem)] font-semibold tracking-[-0.01em] text-foreground">
                ¿Listo para dejar las hojas de cálculo?
              </h2>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
                Escríbenos y vemos juntos qué plan se ajusta a tu negocio.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/#planes"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ver planes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/contactanos"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:border-foreground/30"
              >
                Contáctanos
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-[12.5px] text-muted-foreground">
            <a href={`mailto:${LEGAL_CONTACT.email}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" aria-hidden /> {LEGAL_CONTACT.email}
            </a>
            <a href={`tel:${LEGAL_CONTACT.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" aria-hidden /> {LEGAL_CONTACT.phone}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { Check } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import { CURRENT_VERSION, UPCOMING_UPDATES, LEGAL_CONTACT } from "../data/landing.data";

export default function UpdatesPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Actualizaciones
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Historial de versiones.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Lo que realmente se construyó — sin roadmaps de fantasía. Cada mejora acá ya está
            corriendo en el producto.
          </p>
        </div>

        <section className="mt-14 rounded-2xl border border-primary/30 bg-primary/5 p-7">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {CURRENT_VERSION.label}
          </span>
          <h2 className="mt-2 text-[1.4rem] font-semibold tracking-tight text-foreground">
            {CURRENT_VERSION.title}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {CURRENT_VERSION.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Próximamente
          </h2>
          <div className="mt-6 space-y-4">
            {UPCOMING_UPDATES.map((u) => {
              const Icon = u.icon;
              return (
                <div key={u.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-foreground">{u.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{u.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-secondary/30 p-6">
          <p className="text-[13.5px] font-medium text-foreground">¿Alguna sugerencia?</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Escríbenos a{" "}
            <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-brand hover:underline">
              {LEGAL_CONTACT.email}
            </a>{" "}
            — leemos cada mensaje.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

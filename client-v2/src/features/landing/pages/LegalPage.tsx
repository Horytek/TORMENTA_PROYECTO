import { Mail, Phone, MapPin } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import {
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  LEGAL_CONTACT,
  type LegalSection,
} from "../data/landing.data";

const CONTENT = {
  terms: {
    title: "Términos y condiciones",
    intro:
      "Al acceder y utilizar los servicios de Horytek, aceptas estar legalmente vinculado por estos términos. Si no estás de acuerdo, por favor abstente de utilizar la plataforma.",
    sections: TERMS_SECTIONS,
  },
  privacy: {
    title: "Política de privacidad",
    intro:
      "En Horytek, la privacidad no es una opción, es un estándar base. Esta política detalla cómo protegemos la integridad y confidencialidad de tus datos empresariales.",
    sections: PRIVACY_SECTIONS,
  },
} as const;

interface LegalPageProps {
  kind: keyof typeof CONTENT;
}

export default function LegalPage({ kind }: LegalPageProps) {
  const { title, intro, sections } = CONTENT[kind];

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Legal
        </span>
        <h1 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          {intro}
        </p>

        <ol className="mt-12 space-y-8">
          {sections.map((section, i) => (
            <SectionCard key={section.title} n={i + 1} section={section} />
          ))}
        </ol>

        <div className="mt-14 rounded-xl border border-border bg-card p-6">
          <h2 className="text-[15px] font-semibold text-foreground">Información de contacto</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a
              href={`mailto:${LEGAL_CONTACT.email}`}
              className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /> {LEGAL_CONTACT.email}
            </a>
            <a
              href={`tel:${LEGAL_CONTACT.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden /> {LEGAL_CONTACT.phone}
            </a>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {LEGAL_CONTACT.location}
            </span>
          </div>
          <p className="num mt-5 text-[11px] text-muted-foreground">
            Última actualización:{" "}
            {new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SectionCard({ n, section }: { n: number; section: LegalSection }) {
  const Icon = section.icon;
  return (
    <li className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 border-b border-border pb-8">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {n}. {section.title}
        </h3>
        {section.paragraphs?.map((p) => (
          <p key={p} className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        {section.bullets && (
          <ul className="mt-2.5 space-y-1.5">
            {section.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

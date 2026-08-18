import { Link } from "react-router-dom";
import {
  AtelierButton,
  ATELIER_COPY,
  ATELIER_ROUTES,
  ArtistSignature,
} from "@/features/atelier";
import { PEN_PER_USD, formatFromPrice, formatMoneyPair } from "@/features/atelier/helpers";
import { creatorName, type AtelierCreator } from "@/features/atelier/types";
import type { LandingPricingPlan, LandingProductModule } from "../../../modules/landingModule.types";
import { AtelierVideoSection } from "@/features/atelier/video/AtelierVideoSection";

/** Nunca pintar S/ {plan.price} si unit es fee: esa cifra no es el precio de la card. */
function AtelierPlanAmount({ plan }: { plan: LandingPricingPlan }) {
  const unitIsFee = /fee/i.test(plan.unit);
  const isCreator = plan.id === "creador" || unitIsFee;
  if (isCreator) {
    const usd = plan.price > 0 && !unitIsFee ? plan.price : 9;
    const pen = Math.round(usd * PEN_PER_USD);
    return (
      <p className="at-price-amount">
        <span className="at-display">US$ {usd}</span>
        <span className="at-ui">/mes</span>
        <span className="at-ui mt-1 block text-[13px] text-[var(--at-stone)]">
          ~S/ {pen} · Polar
        </span>
      </p>
    );
  }
  if (plan.id === "cliente" || plan.price === 0 || plan.unit === "gratis") {
    return (
      <p className="at-price-amount">
        <span className="at-display">Gratis</span>
      </p>
    );
  }
  return (
    <p className="at-price-amount">
      <span className="at-display">{formatMoneyPair(plan.price)}</span>
      {plan.unit ? <span className="at-ui">/{plan.unit}</span> : null}
    </p>
  );
}

export function AtelierEditorialHero() {
  return (
    <section id="hero" className="at-land-hero">
      <div className="at-land-wrap">
        <h1 className="at-display at-hero-title">
          <span className="at-hero-line">{ATELIER_COPY.tagline}</span>
        </h1>
        <p className="at-ui at-hero-lead">{ATELIER_COPY.conceptLead}</p>
        <div className="at-hero-cta">
          <AtelierButton size="lg" asChild>
            <Link to={ATELIER_ROUTES.commission}>{ATELIER_COPY.ctaCommission}</Link>
          </AtelierButton>
          <AtelierButton variant="tertiary" size="lg" asChild>
            <Link to={ATELIER_ROUTES.discover}>{ATELIER_COPY.ctaDiscover}</Link>
          </AtelierButton>
        </div>
      </div>
    </section>
  );
}

export function AtelierConcept() {
  return (
    <section id="concepto" className="at-land-concept">
      <div className="at-land-wrap at-land-concept-grid">
        <p className="at-display at-concept-quote">{ATELIER_COPY.conceptBody}</p>
        <p className="at-ui at-concept-aside">
          Un artista, un brief, un encargo. Mercado Pago cobra el dibujo. El archivo original
          llega cuando la obra está lista.
        </p>
      </div>
    </section>
  );
}

export function AtelierVideoBlock() {
  return (
    <section id="video" className="at-land-video">
      <div className="at-land-wrap">
        <h2 className="at-display at-land-h2">{ATELIER_COPY.seeIdeaBecome}</h2>
        <p className="at-ui at-land-dek">Sin sonido. El trazo cuenta la historia.</p>
        <div className="mt-10 md:mt-14">
          <AtelierVideoSection />
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Cuentas la idea",
    body: "Estilo, referencias privadas, presupuesto. El brief queda en el tablero o se dirige a un artista.",
  },
  {
    n: "02",
    title: "El artista propone",
    body: "Precio, plazos y revisiones. Tú aceptas una propuesta. El encargo se confirma.",
  },
  {
    n: "03",
    title: "Llega la obra",
    body: "Boceto, ajustes, entrega. Descargas el original. El artista firma el trabajo.",
  },
] as const;

export function AtelierHowItWorks() {
  return (
    <section id="como" className="at-land-how">
      <div className="at-land-wrap">
        <h2 className="at-display at-land-h2">De la idea a la obra</h2>
        <ol className="at-how-list">
          {STEPS.map((step) => (
            <li key={step.n} className="at-how-item">
              <span className="at-display at-how-n">{step.n}</span>
              <div>
                <h3 className="at-display at-how-title">{step.title}</h3>
                <p className="at-ui at-how-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function AtelierArtistsStrip({ creators }: { creators: AtelierCreator[] }) {
  const list = creators.slice(0, 6);
  return (
    <section id="artistas" className="at-land-artists">
      <div className="at-land-wrap">
        <div className="at-land-artists-head">
          <h2 className="at-display at-land-h2">Artistas que toman encargos</h2>
          <AtelierButton variant="tertiary" asChild>
            <Link to={ATELIER_ROUTES.artists}>{ATELIER_COPY.artists}</Link>
          </AtelierButton>
        </div>
        {list.length ? (
          <ul className="at-artist-row">
            {list.map((c) => (
              <li key={c.slug}>
                <Link to={ATELIER_ROUTES.artist(c.slug)} className="at-focus at-artist-link">
                  <ArtistSignature
                    name={creatorName(c)}
                    mark={formatFromPrice(c.precio_desde) ?? c.estilos ?? undefined}
                    avatarSrc={c.avatar_url || undefined}
                    available={c.disponible == null ? undefined : Boolean(c.disponible)}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="at-ui at-land-dek">Los artistas aparecen aquí cuando publican su estudio.</p>
        )}
      </div>
    </section>
  );
}

export function AtelierPricingTwo({ module }: { module: LandingProductModule }) {
  const { pricing } = module;
  return (
    <section id="planes" className="at-land-pricing">
      <div className="at-land-wrap">
        <h2 className="at-display at-land-h2">{pricing.title}</h2>
        <p className="at-ui at-land-dek">{pricing.body}</p>
        <div className="at-price-grid">
          {pricing.plans.map((plan) => (
            <article
              key={plan.id}
              className={plan.highlight ? "at-price-card at-price-card-ink" : "at-price-card"}
            >
              <h3 className="at-display at-price-name">{plan.name}</h3>
              <p className="at-ui at-price-desc">{plan.description}</p>
              <AtelierPlanAmount plan={plan} />
              <ul className="at-price-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <AtelierButton
                variant={plan.highlight ? "primary" : "secondary"}
                asChild
                className="mt-8 w-full"
              >
                <Link to={plan.cta.href}>{plan.cta.label}</Link>
              </AtelierButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AtelierCtaBand() {
  return (
    <section id="cta" className="at-land-cta">
      <div className="at-land-wrap at-land-cta-inner">
        <h2 className="at-display at-land-h2">{ATELIER_COPY.taglineFull}</h2>
        <div className="at-hero-cta mt-8">
          <AtelierButton size="lg" asChild>
            <Link to={ATELIER_ROUTES.commission}>{ATELIER_COPY.ctaCommission}</Link>
          </AtelierButton>
          <AtelierButton variant="tertiary" size="lg" asChild>
            <Link to={ATELIER_ROUTES.login}>{ATELIER_COPY.login}</Link>
          </AtelierButton>
        </div>
      </div>
    </section>
  );
}

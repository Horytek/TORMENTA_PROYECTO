import type { LandingProductModule } from "../../../modules/landingModule.types";
import { TaxiMapHero } from "../../../maps/TaxiMapHero";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { TaxiDispatchInteractive, TaxiFareZoneInteractive, TaxiLiveTripTicker } from "./taxiSections";

export function TaxiLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Solicitar viaje demo"
      heroMedia={<TaxiMapHero accent={module.accent.accent} />}
      limits="cards"
    >
      <TaxiDispatchInteractive module={module} />
      <TaxiFareZoneInteractive module={module} />
      <TaxiLiveTripTicker module={module} />
    </ProductExperienceShell>
  );
}

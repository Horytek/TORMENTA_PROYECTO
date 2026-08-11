import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ShipMapHero } from "../../../maps/ShipMapHero";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { ShipmentIncidentDesk, ShipmentQuoteInteractive, ShipmentTrackingInteractive } from "./enviosSections";

export function EnviosLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Rastrear envío demo"
      heroMedia={<ShipMapHero accent={module.accent.accent} />}
      limits="cards"
    >
      <ShipmentTrackingInteractive module={module} />
      <ShipmentQuoteInteractive module={module} />
      <ShipmentIncidentDesk module={module} />
    </ProductExperienceShell>
  );
}

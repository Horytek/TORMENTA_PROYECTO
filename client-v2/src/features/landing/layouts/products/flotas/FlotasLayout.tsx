import type { LandingProductModule } from "../../../modules/landingModule.types";
import { FleetMapHero } from "../../../maps/FleetMapHero";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { FleetAvailabilityBoard, FleetFuelComparator, FleetTimelineInteractive } from "./flotasSections";

export function FlotasLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Explorar flota demo"
      heroMedia={<FleetMapHero accent={module.accent.accent} />}
      limits="cards"
    >
      <FleetTimelineInteractive module={module} />
      <FleetFuelComparator module={module} />
      <FleetAvailabilityBoard module={module} />
    </ProductExperienceShell>
  );
}

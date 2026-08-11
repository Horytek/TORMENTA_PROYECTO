import type { LandingProductModule } from "../../../modules/landingModule.types";
import { DeliveryMapHero } from "../../../maps/DeliveryMapHero";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { DeliveryAssignmentInteractive, DeliveryCapacityPlanner, DeliveryEtaSimulator } from "./deliverySections";

export function DeliveryLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Despachar pedido demo"
      heroMedia={<DeliveryMapHero accent={module.accent.accent} />}
      limits="cards"
    >
      <DeliveryAssignmentInteractive module={module} />
      <DeliveryCapacityPlanner module={module} />
      <DeliveryEtaSimulator module={module} />
    </ProductExperienceShell>
  );
}

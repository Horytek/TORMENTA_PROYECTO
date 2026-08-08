import type { LandingProductModule } from "../modules/landingModule.types";
import { MapMobilityLayout } from "../layouts/MapMobilityLayout";
import { MapFleetLayout } from "../layouts/MapFleetLayout";
import { RailOpsLayout } from "../layouts/RailOpsLayout";
import { PlantLayout } from "../layouts/PlantLayout";
import { CommerceLayout } from "../layouts/CommerceLayout";
import { PipelineLayout } from "../layouts/PipelineLayout";
import { LearnBookLayout } from "../layouts/LearnBookLayout";
import { ShipLayout } from "../layouts/ShipLayout";

export interface ExperienceLandingProps {
  module: LandingProductModule;
}

/**
 * Switch por layoutKitId — cada familia tiene compositor propio (no plantilla tintada).
 */
export function ExperienceLanding({ module }: ExperienceLandingProps) {
  switch (module.layoutKitId) {
    case "map-mobility":
      return <MapMobilityLayout module={module} />;
    case "map-fleet":
      return <MapFleetLayout module={module} />;
    case "rail-ops":
      return <RailOpsLayout module={module} />;
    case "plant":
      return <PlantLayout module={module} />;
    case "commerce":
      return <CommerceLayout module={module} />;
    case "pipeline":
      return <PipelineLayout module={module} />;
    case "learn-book":
      return <LearnBookLayout module={module} />;
    case "ship":
      return <ShipLayout module={module} />;
    default:
      return <CommerceLayout module={module} />;
  }
}

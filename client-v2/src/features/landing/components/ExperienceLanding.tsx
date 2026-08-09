import type { LandingProductModule } from "../modules/landingModule.types";
import { MapMobilityLayout } from "../layouts/MapMobilityLayout";
import { MapFleetLayout } from "../layouts/MapFleetLayout";
import { RailOpsLayout } from "../layouts/RailOpsLayout";
import { PlantLayout } from "../layouts/PlantLayout";
import { CommerceLayout } from "../layouts/CommerceLayout";
import { PipelineLayout } from "../layouts/PipelineLayout";
import { LearnBookLayout } from "../layouts/LearnBookLayout";
import { ShipLayout } from "../layouts/ShipLayout";
import { ExperienceDemoCta } from "./ExperienceDemoCta";

export interface ExperienceLandingProps {
  module: LandingProductModule;
}

/**
 * Switch por layoutKitId — cada familia tiene compositor propio (no plantilla tintada).
 */
export function ExperienceLanding({ module }: ExperienceLandingProps) {
  let body;
  switch (module.layoutKitId) {
    case "map-mobility":
      body = <MapMobilityLayout module={module} />;
      break;
    case "map-fleet":
      body = <MapFleetLayout module={module} />;
      break;
    case "rail-ops":
      body = <RailOpsLayout module={module} />;
      break;
    case "plant":
      body = <PlantLayout module={module} />;
      break;
    case "commerce":
      body = <CommerceLayout module={module} />;
      break;
    case "pipeline":
      body = <PipelineLayout module={module} />;
      break;
    case "learn-book":
      body = <LearnBookLayout module={module} />;
      break;
    case "ship":
      body = <ShipLayout module={module} />;
      break;
    default:
      body = <CommerceLayout module={module} />;
  }

  return (
    <>
      {body}
      <ExperienceDemoCta productId={module.productId} />
    </>
  );
}

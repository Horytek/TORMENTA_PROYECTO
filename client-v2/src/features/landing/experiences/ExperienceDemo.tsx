import type { DemoTheme, ExperienceId } from "../modules/landingModule.types";
import { TaxiHeroDemo } from "./TaxiHeroDemo";
import { DeliveryHeroDemo } from "./DeliveryHeroDemo";
import { OpsBoardHeroDemo } from "./OpsBoardHeroDemo";
import { OpsWmsHeroDemo } from "./OpsWmsHeroDemo";
import { OpsFieldHeroDemo } from "./OpsFieldHeroDemo";
import { OpsFleetHeroDemo } from "./OpsFleetHeroDemo";
import { CommerceB2bHeroDemo } from "./CommerceB2bHeroDemo";
import { CommerceSyncHeroDemo } from "./CommerceSyncHeroDemo";
import { CommerceWaHeroDemo } from "./CommerceWaHeroDemo";
import { PipelineCrmHeroDemo } from "./PipelineCrmHeroDemo";
import { PipelineHireHeroDemo } from "./PipelineHireHeroDemo";
import { LearnPathHeroDemo } from "./LearnPathHeroDemo";
import { BookSlotHeroDemo } from "./BookSlotHeroDemo";
import { ShipTrackHeroDemo } from "./ShipTrackHeroDemo";
import { PlantOtHeroDemo } from "./PlantOtHeroDemo";
import { PlantTallerHeroDemo } from "./PlantTallerHeroDemo";
import { PreorderHeroDemo } from "./PreorderHeroDemo";

export interface ExperienceDemoProps {
  experienceId: string;
  accent: string;
  theme?: DemoTheme;
}

function isExperienceId(id: string): id is ExperienceId {
  return [
    "legacy",
    "mobility-taxi",
    "mobility-delivery",
    "ops-board",
    "ops-wms",
    "ops-field",
    "ops-fleet",
    "commerce-b2b",
    "commerce-sync",
    "commerce-wa",
    "pipeline-crm",
    "pipeline-hire",
    "learn-path",
    "book-slot",
    "ship-track",
    "plant-ot",
    "plant-taller",
    "preorder",
  ].includes(id);
}

export function ExperienceDemo({ experienceId, accent, theme = "paper" }: ExperienceDemoProps) {
  const id = isExperienceId(experienceId) ? experienceId : "ops-board";
  const props = { accent, theme };

  switch (id) {
    case "mobility-taxi":
      return <TaxiHeroDemo {...props} />;
    case "mobility-delivery":
      return <DeliveryHeroDemo {...props} />;
    case "ops-board":
      return <OpsBoardHeroDemo {...props} />;
    case "ops-wms":
      return <OpsWmsHeroDemo {...props} />;
    case "ops-field":
      return <OpsFieldHeroDemo {...props} />;
    case "ops-fleet":
      return <OpsFleetHeroDemo {...props} />;
    case "commerce-b2b":
      return <CommerceB2bHeroDemo {...props} />;
    case "commerce-sync":
      return <CommerceSyncHeroDemo {...props} />;
    case "commerce-wa":
      return <CommerceWaHeroDemo {...props} />;
    case "pipeline-crm":
      return <PipelineCrmHeroDemo {...props} />;
    case "pipeline-hire":
      return <PipelineHireHeroDemo {...props} />;
    case "learn-path":
      return <LearnPathHeroDemo {...props} />;
    case "book-slot":
      return <BookSlotHeroDemo {...props} />;
    case "ship-track":
      return <ShipTrackHeroDemo {...props} />;
    case "plant-ot":
      return <PlantOtHeroDemo {...props} />;
    case "plant-taller":
      return <PlantTallerHeroDemo {...props} />;
    case "preorder":
      return <PreorderHeroDemo {...props} />;
    case "legacy":
    default:
      return <OpsBoardHeroDemo {...props} />;
  }
}

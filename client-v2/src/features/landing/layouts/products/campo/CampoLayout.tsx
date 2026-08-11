import type { LandingProductModule } from "../../../modules/landingModule.types";
import { OpsFieldHeroDemo } from "../../../experiences/OpsFieldHeroDemo";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { CampoDayPlanner, CampoVisitSignals, CampoOutcomeToggle } from "./campoSections";

export function CampoLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Probar Campo"
      limits="dense"
      heroMedia={
        <OpsFieldHeroDemo
          accent={module.accent.accent}
          theme={module.accent.demoTheme}
        />
      }
    >
      <CampoDayPlanner module={module} />
      <CampoOutcomeToggle module={module} />
      <CampoVisitSignals module={module} />
    </ProductExperienceShell>
  );
}

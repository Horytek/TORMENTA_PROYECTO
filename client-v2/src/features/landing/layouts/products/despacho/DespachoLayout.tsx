import type { LandingProductModule } from "../../../modules/landingModule.types";
import { OpsBoardHeroDemo } from "../../../experiences/OpsBoardHeroDemo";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { DespachoRouteBoard, DespachoShiftSummary, DespachoEtaBoard } from "./despachoSections";

export function DespachoLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Probar Despacho"
      limits="dense"
      heroMedia={
        <OpsBoardHeroDemo
          accent={module.accent.accent}
          theme={module.accent.demoTheme}
        />
      }
    >
      <DespachoRouteBoard module={module} />
      <DespachoEtaBoard module={module} />
      <DespachoShiftSummary module={module} />
    </ProductExperienceShell>
  );
}

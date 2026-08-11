import type { LandingProductModule } from "../../../modules/landingModule.types";
import { OpsWmsHeroDemo } from "../../../experiences/OpsWmsHeroDemo";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { WmsPickingSimulation, WmsOperationalSnapshot, WmsBinScanner } from "./wmsSections";

export function WmsLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Probar WMS"
      limits="dense"
      heroMedia={
        <OpsWmsHeroDemo
          accent={module.accent.accent}
          theme={module.accent.demoTheme}
        />
      }
    >
      <WmsPickingSimulation module={module} />
      <WmsBinScanner module={module} />
      <WmsOperationalSnapshot module={module} />
    </ProductExperienceShell>
  );
}

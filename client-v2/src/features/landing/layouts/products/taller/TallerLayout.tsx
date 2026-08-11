import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { TallerMaterialCalculator, TallerOtMachine, TallerQualityChecklist, TallerResumen } from "./tallerSections";

export function TallerLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Taller" limits="dense">
      <TallerOtMachine module={module} />
      <TallerMaterialCalculator module={module} />
      <TallerQualityChecklist module={module} />
      <TallerResumen module={module} />
    </ProductExperienceShell>
  );
}

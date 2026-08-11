import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { ReclutaCriteriaBuilder, ReclutaFunnel, ReclutaInterviewScorecard } from "./reclutaSections";

export function ReclutaLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Recluta" limits="cards">
      <ReclutaFunnel module={module} />
      <ReclutaCriteriaBuilder module={module} />
      <ReclutaInterviewScorecard module={module} />
    </ProductExperienceShell>
  );
}

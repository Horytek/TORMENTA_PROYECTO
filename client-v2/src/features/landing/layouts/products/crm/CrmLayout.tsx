import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { CrmFollowUpPlanner, CrmLeadScoring, CrmPipeline } from "./crmSections";

export function CrmLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar CRM" limits="cards">
      <CrmPipeline module={module} />
      <CrmLeadScoring module={module} />
      <CrmFollowUpPlanner module={module} />
    </ProductExperienceShell>
  );
}

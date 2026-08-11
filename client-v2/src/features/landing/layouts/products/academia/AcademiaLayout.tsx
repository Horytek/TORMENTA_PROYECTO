import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { AcademiaCertificatePreview, AcademiaCoursePath, AcademiaQuizInteractive } from "./academiaSections";

export function AcademiaLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Academia" limits="cards">
      <AcademiaCoursePath module={module} />
      <AcademiaQuizInteractive module={module} />
      <AcademiaCertificatePreview module={module} />
    </ProductExperienceShell>
  );
}

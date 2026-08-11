import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import {
  MayoristaAccountSwitcher,
  MayoristaOrderBuilder,
  MayoristaTermsDesk,
} from "./mayoristaSections";

export function MayoristaLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Mayorista" limits="cards">
      <MayoristaAccountSwitcher module={module} />
      <MayoristaOrderBuilder module={module} />
      <MayoristaTermsDesk module={module} />
    </ProductExperienceShell>
  );
}

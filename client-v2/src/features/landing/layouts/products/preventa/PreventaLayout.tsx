import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import {
  PreventaCountdown,
  PreventaPaymentBoard,
  PreventaQuotaScrubber,
} from "./preventaSections";

export function PreventaLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Preventa">
      <PreventaQuotaScrubber module={module} />
      <PreventaPaymentBoard module={module} />
      <PreventaCountdown module={module} />
    </ProductExperienceShell>
  );
}

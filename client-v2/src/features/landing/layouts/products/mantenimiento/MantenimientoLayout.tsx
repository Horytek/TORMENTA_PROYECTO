import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { MantenimientoPreventivo, MantenimientoRiskMatrix, MantenimientoWorkOrderInteractive } from "./mantenimientoSections";

export function MantenimientoLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Mantenimiento" limits="dense">
      <MantenimientoPreventivo module={module} />
      <MantenimientoRiskMatrix module={module} />
      <MantenimientoWorkOrderInteractive module={module} />
    </ProductExperienceShell>
  );
}

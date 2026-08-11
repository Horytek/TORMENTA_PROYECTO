import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import {
  SyncConflictResolver,
  SyncJobConsole,
  SyncRouteBoard,
} from "./syncSections";

export function SyncLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell module={module} primaryLabel="Probar Sync">
      <SyncJobConsole module={module} />
      <SyncRouteBoard module={module} />
      <SyncConflictResolver module={module} />
    </ProductExperienceShell>
  );
}

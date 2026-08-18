import { Check } from "lucide-react";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ProductExperienceShell } from "../ProductExperienceShell";
import {
  AtelierDiscovery,
  AtelierHeroMedia,
  AtelierOrderTracker,
  AtelierQuote,
} from "./atelierSections";

export function AtelierLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Explorar Atelier"
      limits="cards"
      heroExtra={
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
          {module.copy.trust.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12px] font-medium text-foreground/80">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: module.accent.accent }}
              >
                <Check className="h-3 w-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      }
      heroMedia={<AtelierHeroMedia accent={module.accent.accent} />}
    >
      <AtelierDiscovery module={module} />
      <AtelierQuote module={module} />
      <AtelierOrderTracker module={module} />
    </ProductExperienceShell>
  );
}

import type { LandingProductModule } from "../../../modules/landingModule.types";
import { BookSlotHeroDemo } from "../../../experiences/BookSlotHeroDemo";
import { ProductExperienceShell } from "../ProductExperienceShell";
import { AgendaReminderBuilder, AgendaSlotPicker, AgendaWaitlistInteractive } from "./agendaSections";

export function AgendaLayout({ module }: { module: LandingProductModule }) {
  return (
    <ProductExperienceShell
      module={module}
      primaryLabel="Probar Agenda"
      heroMedia={
        <BookSlotHeroDemo
          accent={module.accent.accent}
          theme={module.accent.demoTheme}
        />
      }
      limits="cards"
    >
      <AgendaSlotPicker module={module} />
      <AgendaReminderBuilder module={module} />
      <AgendaWaitlistInteractive module={module} />
    </ProductExperienceShell>
  );
}

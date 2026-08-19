import { AbsoluteFill } from "remotion";
import { CTASection } from "../components/CTASection";
import { SafeStage } from "../components/SafeStage";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 6 — Cierre con URL y CTA (sin teléfono). */
export function Scene06_Closing() {
  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.bg }}>
      <SafeStage>
        <CTASection />
      </SafeStage>
    </AbsoluteFill>
  );
}

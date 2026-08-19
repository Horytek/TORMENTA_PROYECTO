import { FullFrameLayout } from "../components/FullFrameLayout";
import { WhatsAppCTA } from "../components/WhatsAppCTA";
import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

/** Escena 7 — CTA centrado sobre gradiente marca (sin blanco). */
export function Scene07_CTA() {
  return (
    <FullFrameLayout gradient={CREANDO_MODA_V2.colors.gradientCta}>
      <WhatsAppCTA />
    </FullFrameLayout>
  );
}

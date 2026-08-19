import { AbsoluteFill } from "remotion";
import { productsForScene } from "../creandoModa.data";
import { SafeStage } from "../components/SafeStage";
import { StorefrontMock } from "../components/StorefrontMock";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 5 — Mock vitrina ecommerce con datos reales. */
export function Scene05_Storefront() {
  const [product] = productsForScene("storefront");
  if (!product) return null;

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.bg }}>
      <SafeStage>
        <StorefrontMock product={product} />
      </SafeStage>
    </AbsoluteFill>
  );
}

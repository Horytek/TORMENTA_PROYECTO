import { Composition } from "remotion";
import { CreandoModaTiktok } from "../../ecommerce/video/tiktok/CreandoModaTiktok";
import { CreandoModaTiktokV2 } from "../../ecommerce/video/tiktok/v2/CreandoModaTiktokV2";
import {
  CREANDO_MODA,
  CREANDO_MODA_ID,
} from "../../ecommerce/video/tiktok/tiktokConfig";
import {
  CREANDO_MODA_V2,
  CREANDO_MODA_V2_ID,
} from "../../ecommerce/video/tiktok/v2/tiktokConfig.v2";
import { HorytekAd } from "./HorytekAd";
import { HorytekTiktok } from "./tiktok/HorytekTiktok";
import { VIDEO, VIDEO_ID } from "./videoConfig";
import { TIKTOK, TIKTOK_ID } from "./tiktok/tiktokConfig";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id={VIDEO_ID}
        component={HorytekAd}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id={TIKTOK_ID}
        component={HorytekTiktok}
        durationInFrames={TIKTOK.durationInFrames}
        fps={TIKTOK.fps}
        width={TIKTOK.width}
        height={TIKTOK.height}
      />
      <Composition
        id={CREANDO_MODA_ID}
        component={CreandoModaTiktok}
        durationInFrames={CREANDO_MODA.durationInFrames}
        fps={CREANDO_MODA.fps}
        width={CREANDO_MODA.width}
        height={CREANDO_MODA.height}
      />
      <Composition
        id={CREANDO_MODA_V2_ID}
        component={CreandoModaTiktokV2}
        durationInFrames={CREANDO_MODA_V2.durationInFrames}
        fps={CREANDO_MODA_V2.fps}
        width={CREANDO_MODA_V2.width}
        height={CREANDO_MODA_V2.height}
      />
    </>
  );
}

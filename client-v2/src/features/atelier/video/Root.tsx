import { Composition } from "remotion";
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
    </>
  );
}

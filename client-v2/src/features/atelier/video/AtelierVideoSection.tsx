import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { ATELIER_COPY } from "../copy";
import { VIDEO } from "./videoConfig";
import { AdPoster } from "./AdPoster";

type PlayerProps = {
  component: ComponentType;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  autoPlay?: boolean;
  loop?: boolean;
  initiallyMuted?: boolean;
  controls?: boolean;
  clickToPlay?: boolean;
  numberOfSharedAudioTags?: number;
  acknowledgeRemotionLicense?: boolean;
  renderPoster?: () => ReactNode;
  showPosterWhenUnplayed?: boolean;
  showPosterWhenBuffering?: boolean;
  style?: CSSProperties;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Player Remotion: se carga solo al entrar al viewport.
 * Autoplay muted (canvas, equivalente a playsInline). Poster hasta que carga.
 * La narración se entiende sin audio.
 */
export function AtelierVideoSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [Player, setPlayer] = useState<ComponentType<PlayerProps> | null>(null);
  const [Ad, setAd] = useState<ComponentType | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const el = stageRef.current;
    if (!el) return;

    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        void Promise.all([import("@remotion/player"), import("./HorytekAd")])
          .then(([playerMod, adMod]) => {
            if (cancelled) return;
            setPlayer(() => playerMod.Player as ComponentType<PlayerProps>);
            setAd(() => adMod.HorytekAd);
          })
          .catch(() => undefined);
      },
      { rootMargin: "240px 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [reduceMotion]);

  const showPlayer = Boolean(Player && Ad);

  return (
    <div>
      <div className="at-video-stage" ref={stageRef}>
        {showPlayer && Player && Ad ? (
          <Player
            component={Ad}
            durationInFrames={VIDEO.durationInFrames}
            fps={VIDEO.fps}
            compositionWidth={VIDEO.width}
            compositionHeight={VIDEO.height}
            autoPlay
            loop
            initiallyMuted
            controls
            clickToPlay
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
            renderPoster={() => <AdPoster />}
            showPosterWhenUnplayed
            showPosterWhenBuffering
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <AdPoster />
        )}
      </div>
      <p className="sr-only">
        {ATELIER_COPY.seeIdeaBecome}. {ATELIER_COPY.taglineFull}
      </p>
    </div>
  );
}

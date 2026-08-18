import { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender } from "remotion";
import { FilmGrain } from "./components/FilmGrain";
import { loadAtelierFonts } from "./loadAtelierFonts";
import { Artwork } from "./scenes/Artwork";
import { Artist } from "./scenes/Artist";
import { Creation } from "./scenes/Creation";
import { Idea } from "./scenes/Idea";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Sketch } from "./scenes/Sketch";
import { VIDEO, sceneSpans } from "./videoConfig";

export function HorytekAd() {
  const [handle] = useState(() => delayRender("atelier-fonts"));
  const spans = sceneSpans();

  useEffect(() => {
    void loadAtelierFonts().then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: VIDEO.colors.paper }}>
      <Sequence from={spans.intro.from} durationInFrames={spans.intro.duration}>
        <Intro />
      </Sequence>
      <Sequence from={spans.idea.from} durationInFrames={spans.idea.duration}>
        <Idea />
      </Sequence>
      <Sequence from={spans.artist.from} durationInFrames={spans.artist.duration}>
        <Artist />
      </Sequence>
      <Sequence from={spans.sketch.from} durationInFrames={spans.sketch.duration}>
        <Sketch />
      </Sequence>
      <Sequence from={spans.creation.from} durationInFrames={spans.creation.duration}>
        <Creation />
      </Sequence>
      <Sequence from={spans.artwork.from} durationInFrames={spans.artwork.duration}>
        <Artwork />
      </Sequence>
      <Sequence from={spans.outro.from} durationInFrames={spans.outro.duration}>
        <Outro />
      </Sequence>
      <FilmGrain />
    </AbsoluteFill>
  );
}

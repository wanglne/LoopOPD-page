import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import { FigureComposition } from "../animations/FigureComposition";
import type { VectorAsset } from "../animations/FigureComposition";
import { FPS, storyboards, toPlayerFrame } from "../animations/storyboards";

interface Props {
  src: string;
  alt: string;
}

const serverMedia = () => false;
function useMedia(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, snapshot, serverMedia);
}

function OriginalCrop({ src, box }: { src: string; box: string }) {
  return (
    <svg viewBox={box} width="100%" height="100%" aria-hidden="true">
      <image href={src} width="638.251" height="275.07" />
    </svg>
  );
}

function MethodTeaserScene({
  artwork,
  compact,
  src,
}: {
  artwork: VectorAsset;
  compact: boolean;
  src: string;
}) {
  const common = {
    artwork,
    name: "method" as const,
    compact: false,
    focus: null,
  };
  if (!compact) return <FigureComposition {...common} variant="both" />;
  return (
    <div className="method-teaser-panels">
      <FigureComposition {...common} variant="fixed" crop={[0, 0, 334, 242]} />
      <FigureComposition
        {...common}
        variant="dynamic"
        crop={[353, 0, 285.251, 242]}
      />
      <OriginalCrop src={src} box="234 248 218 27" />
    </div>
  );
}

function StaticMethod({ src, alt }: Props) {
  return (
    <div className="method-teaser-fallback">
      <img
        className="method-teaser-desktop"
        src={src}
        alt={alt}
        width="638.251"
        height="275.07"
        decoding="async"
      />
      <div
        className="method-teaser-panels method-teaser-mobile"
        aria-hidden="true"
      >
        <OriginalCrop src={src} box="-4 -4 342 250" />
        <OriginalCrop src={src} box="349 -4 293.251 250" />
        <OriginalCrop src={src} box="234 248 218 27" />
      </div>
    </div>
  );
}

export default function MethodTeaser({ src, alt }: Props) {
  const [artwork, setArtwork] = useState<VectorAsset | null>(null);
  const compact = useMedia("(max-width: 640px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    let active = true;
    void import("../animations/method-vectors.json")
      .then(({ default: asset }) => {
        if (active) setArtwork(asset);
      })
      .catch(() => {
        /* Keep the original vector figure if loading fails. */
      });
    return () => {
      active = false;
    };
  }, [reduced]);

  useEffect(() => {
    const player = playerRef.current;
    const element = containerRef.current;
    if (!player || !element || reduced) return;
    let visible = false;
    const updatePlayback = () => {
      if (visible && !document.hidden) void player.play();
      else player.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", updatePlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      player.pause();
    };
  }, [artwork, reduced]);

  return (
    <div
      ref={containerRef}
      className="method-teaser-stage"
      data-method-teaser
      role="img"
      aria-label={alt}
    >
      {artwork && !reduced ? (
        <Player
          ref={playerRef}
          overrideInternalClassName="vector-animation-canvas"
          component={MethodTeaserScene}
          inputProps={{ artwork, compact, src }}
          durationInFrames={toPlayerFrame(storyboards.method.duration)}
          fps={FPS}
          compositionWidth={compact ? 640 : 1200}
          compositionHeight={compact ? 1090 : 526}
          style={{ width: "100%" }}
          loop
          autoPlay
          initiallyMuted
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          showPosterWhenBuffering={false}
          numberOfSharedAudioTags={0}
          errorFallback={() => <StaticMethod src={src} alt={alt} />}
        />
      ) : (
        <StaticMethod src={src} alt={alt} />
      )}
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Player } from "@remotion/player";
import type { CallbackListener, PlayerRef } from "@remotion/player";
import type { VectorAsset } from "../animations/FigureComposition";
import { FigureComposition } from "../animations/FigureComposition";
import {
  chapterAt,
  FPS,
  storyboards,
  toPlayerFrame,
  toTimelineFrame,
} from "../animations/storyboards";
import type { FigureName } from "../animations/storyboards";

interface Props {
  name: FigureName;
  alt: string;
  src: string;
}
const time = (frame: number) =>
  `${Math.floor(frame / FPS / 60)}:${String(Math.floor(frame / FPS) % 60).padStart(2, "0")}`;
const subscribeReady = () => () => {};
const isReady = () => true;
const isServer = () => false;
function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, snapshot, isServer);
}
export default function AnimatedFigure({ name, alt, src }: Props) {
  const board = storyboards[name];
  const [artwork, setArtwork] = useState<VectorAsset | null>(null);
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ready = useSyncExternalStore(subscribeReady, isReady, isServer);
  const compact = useMediaQuery("(max-width: 640px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [requestedMode, setRequestedMode] = useState<
    "animation" | "original" | "auto"
  >("auto");
  const mode =
    requestedMode === "auto"
      ? reduced
        ? "original"
        : "animation"
      : requestedMode;
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [focus, setFocus] = useState<number | null>(null);
  const [variant, setVariant] = useState<"both" | "fixed" | "dynamic">("both");
  const chapterIndex = chapterAt(name, toTimelineFrame(frame));
  const chapter = board.chapters[chapterIndex];
  const inFrame =
    focus === null ? 0 : toPlayerFrame(board.chapters[focus].start);
  const outFrame =
    toPlayerFrame(focus === null ? board.duration : board.chapters[focus].end) -
    1;
  const inputProps = useMemo(
    () => ({ name, compact, variant, focus, artwork: artwork! }),
    [name, compact, variant, focus, artwork],
  );
  const title =
    mode === "original" || !chapter ? board.fullTitle : chapter.title;
  const description =
    mode === "original" || !chapter
      ? board.fullDescription
      : chapter.description;

  useEffect(() => {
    let active = true;
    const load =
      name === "intro"
        ? import("../animations/intro-vectors.json")
        : import("../animations/method-vectors.json");
    void load
      .then(({ default: asset }) => {
        if (active) setArtwork(asset);
      })
      .catch(() => {
        if (active) setRequestedMode("original");
      });
    return () => {
      active = false;
    };
  }, [name]);

  useEffect(() => {
    const current = playerRef.current;
    const element = containerRef.current;
    if (!current || !element) return;
    const update: CallbackListener<"frameupdate"> = (event) =>
      setFrame(event.detail.frame);
    const onPlay = () => {
      setPlaying(true);
      window.dispatchEvent(
        new CustomEvent("loopopd-animation-play", { detail: name }),
      );
    };
    const onPause = () => setPlaying(false);
    const visibility = () => {
      if (document.hidden) current.pause();
    };
    const otherPlayer = (event: Event) => {
      if ((event as CustomEvent).detail !== name) current.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) current.pause();
      },
      { threshold: 0 },
    );
    observer.observe(element);
    current.addEventListener("frameupdate", update);
    current.addEventListener("play", onPlay);
    current.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("loopopd-animation-play", otherPlayer);
    return () => {
      observer.disconnect();
      current.removeEventListener("frameupdate", update);
      current.removeEventListener("play", onPlay);
      current.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("loopopd-animation-play", otherPlayer);
    };
  }, [ready, mode, name, artwork]);

  const selectChapter = (index: number | null) => {
    playerRef.current?.pause();
    setFocus(index);
    const target =
      index === null ? 0 : toPlayerFrame(board.chapters[index].start + 18);
    playerRef.current?.seekTo(target);
    setFrame(target);
  };
  const switchMode = (next: "animation" | "original") => {
    playerRef.current?.pause();
    setPlaying(false);
    setRequestedMode(next);
  };
  const seek = (next: number) => {
    playerRef.current?.pause();
    playerRef.current?.seekTo(next);
    setFrame(next);
  };

  return (
    <div
      className="figure-player animation-player not-prose"
      data-animation={name}
      ref={containerRef}
    >
      <div className="figure-toolbar">
        <span>{board.title}</span>
        {ready && (
          <div
            className="animation-modes"
            role="group"
            aria-label="Figure format"
          >
            <button
              type="button"
              onClick={() => switchMode("animation")}
              aria-pressed={mode === "animation"}
            >
              Animation
            </button>
            <button
              type="button"
              onClick={() => switchMode("original")}
              aria-pressed={mode === "original"}
            >
              Original figure
            </button>
          </div>
        )}
      </div>
      {ready && mode === "animation" && name === "method" && (
        <div
          className="animation-variants"
          role="group"
          aria-label="Method variant"
        >
          {!compact && (
            <button
              type="button"
              aria-pressed={variant === "both"}
              onClick={() => setVariant("both")}
            >
              Side by side
            </button>
          )}
          <button
            type="button"
            aria-pressed={variant === "fixed"}
            onClick={() => setVariant("fixed")}
          >
            LoopOPD
          </button>
          <button
            type="button"
            aria-pressed={
              variant === "dynamic" || (compact && variant === "both")
            }
            onClick={() => setVariant("dynamic")}
          >
            D-LoopOPD
          </button>
        </div>
      )}
      <div
        className={`animation-stage${mode === "original" || !ready ? "is-original" : ""}`}
      >
        {ready && artwork && mode === "animation" ? (
          <div role="img" aria-label={`${alt} ${title}`}>
            <Player
              ref={playerRef}
              overrideInternalClassName="vector-animation-canvas"
              component={FigureComposition}
              inputProps={inputProps}
              durationInFrames={toPlayerFrame(board.duration)}
              fps={FPS}
              compositionWidth={compact ? 600 : 1200}
              compositionHeight={
                compact
                  ? name === "intro"
                    ? 570
                    : 520
                  : name === "intro"
                    ? 435
                    : 518
              }
              style={{ width: "100%" }}
              initialFrame={frame}
              inFrame={inFrame}
              outFrame={outFrame}
              loop
              controls={false}
              clickToPlay={false}
              spaceKeyToPlayOrPause={false}
              numberOfSharedAudioTags={0}
              errorFallback={() => (
                <img src={src} alt={alt} className="animation-static" />
              )}
            />
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="animation-static"
            width={board.box[2]}
            height={board.box[3]}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      {ready && artwork && mode === "animation" && (
        <div className="animation-transport">
          <button
            type="button"
            className="figure-play"
            aria-pressed={playing}
            onClick={() => playerRef.current?.toggle()}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              {playing ? (
                <path fill="currentColor" d="M5 4h3v12H5zm7 0h3v12h-3z" />
              ) : (
                <path fill="currentColor" d="m6 3 11 7-11 7z" />
              )}
            </svg>
            {playing ? "Pause" : "Play animation"}
          </button>
          <button
            type="button"
            className="animation-replay"
            onClick={() => seek(inFrame)}
            aria-label="Restart animation"
            title="Restart animation"
          >
            <svg
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M4 6a7 7 0 1 1-1 7M4 2v5h5" />
            </svg>
          </button>
          <input
            type="range"
            min={inFrame}
            max={outFrame}
            value={Math.max(inFrame, Math.min(outFrame, frame))}
            step="1"
            onChange={(event) => seek(Number(event.target.value))}
            aria-label={`${name === "intro" ? "Overview" : "Method"} animation progress`}
            aria-valuetext={`${time(frame - inFrame)} of ${time(outFrame - inFrame + 1)}`}
          />
          <span className="animation-time" aria-hidden="true">
            {time(frame - inFrame)} / {time(outFrame - inFrame + 1)}
          </span>
        </div>
      )}
      <div
        className="figure-narrative"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="true"
      >
        <h3 id={`figure-title-${name}`}>{title}</h3>
        <p>{description}</p>
      </div>
      {ready && artwork && mode === "animation" && (
        <div
          className="figure-steps animation-chapters"
          role="group"
          aria-label="Animation chapter"
        >
          <button
            type="button"
            aria-pressed={focus === null}
            onClick={() => selectChapter(null)}
          >
            Full sequence
          </button>
          {board.chapters.map((item, index) => (
            <button
              type="button"
              key={item.label}
              aria-pressed={focus === index}
              data-current={chapterIndex === index ? "true" : undefined}
              onClick={() => selectChapter(index)}
            >
              <span className="figure-step-number" aria-hidden="true">
                {index + 1}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
      {ready && reduced && mode === "original" && (
        <p className="animation-preference">
          Reduced motion is enabled. Select Animation to play manually.
        </p>
      )}
    </div>
  );
}

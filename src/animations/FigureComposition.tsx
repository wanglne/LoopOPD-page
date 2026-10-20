import { memo, useId, useMemo } from "react";
import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  chapterAt,
  introMotion,
  methodMotion,
  storyboards,
  toTimelineFrame,
} from "./storyboards";
import type { Box, FigureName } from "./storyboards";
import arrowGeometry from "./arrow-geometry.json";

// Motion indicates the active information flow. Yellow and blue remain reserved
// for trainable and frozen models in the original artwork.
const FLOW_COLOR = "#374151";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const rise = (frame: number, from: number, length = 16) =>
  smoothstep(interpolate(frame, [from, from + length], [0, 1], clamp));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixBox = (from: Box, to: Box, t: number): Box => [
  mix(from[0], to[0], t),
  mix(from[1], to[1], t),
  mix(from[2], to[2], t),
  mix(from[3], to[3], t),
];
export interface VectorAsset {
  groups: string[];
  markup: string;
}

// These are local, outlined exports of the supplied paper artwork. The markup
// contains only SVG geometry; no fetched or user-provided HTML is injected.
const VectorArtwork = memo(function VectorArtwork({
  artwork,
}: {
  artwork: VectorAsset;
}) {
  // Multiple copies of a figure must not share SVG glyph or clipping IDs.
  const id = useId();
  const markup = useMemo(() => {
    const prefix = `figure-${id.replace(/[^a-zA-Z0-9_-]/g, "")}-`;
    return artwork.markup
      .replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
      .replace(/((?:xlink:)?href=")#([^"]+)"/g, `$1#${prefix}$2"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);
  }, [artwork.markup, id]);
  // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
  return <g dangerouslySetInnerHTML={{ __html: markup }} />;
});

interface ArrowRoute {
  id: string;
  outline: string;
  points: readonly (readonly number[])[];
}
interface FlowProps {
  route: ArrowRoute;
  frame: number;
  start: number;
  duration?: number;
}
function Flow({ route, frame, start, duration = 28 }: FlowProps) {
  const clipId = `flow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { points } = route;
  const { lengths, total, d } = useMemo(() => {
    const lengths = points
      .slice(1)
      .map((point, i) =>
        Math.hypot(point[0] - points[i][0], point[1] - points[i][1]),
      );
    return {
      lengths,
      total: lengths.reduce((a, b) => a + b, 0),
      d: points.map(([px, py], i) => `${i ? "L" : "M"} ${px} ${py}`).join(" "),
    };
  }, [points]);
  const t = rise(frame, start, duration);
  if (t <= 0) return null;
  let distance = total * t;
  let segment = 0;
  while (segment < lengths.length - 1 && distance > lengths[segment])
    distance -= lengths[segment++];
  const fraction = lengths[segment] ? distance / lengths[segment] : 1;
  const x = mix(points[segment][0], points[segment + 1][0], fraction);
  const y = mix(points[segment][1], points[segment + 1][1], fraction);
  // Settle the completed trace as the destination lights up, without a one-frame
  // brightness drop or a particle disappearing abruptly at the arrowhead.
  const opacity = mix(0.95, 0.42, rise(frame, start + duration, 12));
  const particleOpacity =
    rise(frame, start, 5) * (1 - rise(frame, start + duration - 6, 6));
  return (
    <g opacity={opacity} data-flow={route.id}>
      <defs>
        <clipPath id={clipId}>
          <path d={route.outline} />
        </clipPath>
      </defs>
      <path
        data-flow-trace
        clipPath={`url(#${clipId})`}
        d={d}
        fill="none"
        stroke={FLOW_COLOR}
        strokeWidth={12}
        strokeLinecap="butt"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - t}
      />
      {t < 1 && (
        <g opacity={particleOpacity} data-flow-particle>
          <circle cx={x} cy={y} r={4} fill={FLOW_COLOR} opacity={0.13} />
          <circle cx={x} cy={y} r={1.9} fill={FLOW_COLOR} />
        </g>
      )}
    </g>
  );
}
function introCues(chapter: number) {
  type Route = keyof typeof arrowGeometry.intro;
  const { recurrent, fixed, dynamic } = introMotion;
  let cues: { route: Route; start: number; duration: number }[] = [];
  if (chapter === 0 || chapter === 1) {
    const prefix = chapter === 0 ? "grpo" : "rltt";
    cues = [
      { route: `${prefix}-input`, ...recurrent.input },
      { route: `${prefix}-next`, ...recurrent.next },
      { route: `${prefix}-ellipsis`, ...recurrent.ellipsis },
      { route: `${prefix}-terminal`, ...recurrent.terminal },
      { route: `${prefix}-rollout`, ...recurrent.rollout },
      { route: `${prefix}-reward`, ...recurrent.reward },
      {
        route: chapter === 0 ? "grpo-feedback" : "rltt-feedback-high",
        ...recurrent.feedback,
      },
    ];
    if (chapter === 1)
      cues.push(
        { route: "rltt-feedback-ellipsis", ...recurrent.feedback },
        { route: "rltt-feedback-middle", ...recurrent.feedback },
        { route: "rltt-feedback-low", ...recurrent.feedback },
      );
  } else if (chapter === 3) {
    cues = [
      { route: "fixed-input", ...fixed.input },
      { route: "fixed-next", ...fixed.next },
      { route: "fixed-rollout", ...fixed.rollout },
      { route: "fixed-context", ...fixed.context },
      // The prompt and generated rollout enter the teacher together.
      { route: "fixed-teacher-prompt", ...fixed.context },
      { route: "fixed-teacher-next", ...fixed.teacherNext },
      { route: "fixed-teacher-ellipsis", ...fixed.teacherEllipsis },
      { route: "fixed-teacher-terminal", ...fixed.teacherTerminal },
      { route: "fixed-supervision", ...fixed.supervision },
    ];
  } else if (chapter === 4) {
    cues = [
      { route: "dynamic-input", ...dynamic.input },
      { route: "dynamic-next", ...dynamic.next },
      { route: "dynamic-rollout", ...dynamic.rollout },
      { route: "dynamic-terminal", ...dynamic.terminal },
      { route: "dynamic-supervision", ...dynamic.supervision },
      { route: "dynamic-refresh", ...dynamic.refresh },
    ];
  }
  return cues;
}
function IntroFlow({ chapter, frame }: { chapter: number; frame: number }) {
  return introCues(chapter).map(({ route, ...timing }) => (
    <Flow
      key={route}
      route={arrowGeometry.intro[route]}
      frame={frame}
      {...timing}
    />
  ));
}

function methodCues(chapter: number) {
  const { student, teacher, distillation } = methodMotion;
  type Route = keyof typeof arrowGeometry.method;
  let cues: { route: Route; start: number; duration: number }[] = [];
  if (chapter === 0) {
    cues = [
      { route: "student-input", ...student.input },
      { route: "dynamic-input", ...student.input },
      { route: "student-next", ...student.nextLoop },
      { route: "dynamic-next", ...student.nextLoop },
      { route: "student-rollout", ...student.rollout },
      { route: "dynamic-rollout", ...student.rollout },
    ];
  } else if (chapter === 1) {
    cues = [
      { route: "teacher-context", ...teacher.context },
      { route: "teacher-prompt", ...teacher.context },
      { route: "teacher-next", ...teacher.nextLoop },
      { route: "teacher-ellipsis", ...teacher.ellipsis },
      { route: "teacher-terminal", ...teacher.terminal },
      { route: "dynamic-ellipsis", ...teacher.ellipsis },
      { route: "dynamic-terminal", ...teacher.terminal },
    ];
  } else if (chapter === 2) {
    cues = [
      { route: "student-loss", ...distillation.signals },
      { route: "dynamic-student-loss", ...distillation.signals },
      { route: "teacher-loss", ...distillation.signals },
      { route: "dynamic-teacher-loss", ...distillation.signals },
    ];
  } else if (chapter === 3) {
    cues = [
      { route: "student-update", start: 8, duration: 48 },
      { route: "dynamic-update", start: 8, duration: 48 },
    ];
  }
  return cues;
}
function MethodFlow({ chapter, frame }: { chapter: number; frame: number }) {
  return (
    <>
      {methodCues(chapter).map(({ route, ...timing }) => (
        <Flow
          key={route}
          route={arrowGeometry.method[route]}
          frame={frame}
          {...timing}
        />
      ))}
      {chapter === 3 && (
        <g
          opacity={rise(frame, 88)}
          fontFamily="Arial, sans-serif"
          fontSize={8}
        >
          <text x={112.5} y={123.6} textAnchor="middle" fill={FLOW_COLOR}>
            Teacher stays frozen
          </text>
          <text x={467} y={123.6} textAnchor="middle" fill={FLOW_COLOR}>
            Next teacher is refreshed
          </text>
        </g>
      )}
    </>
  );
}

function chapterOpacities(
  name: FigureName,
  index: number,
  frame: number,
  groups: string[],
) {
  const vars: Record<string, number> = {};
  if (index < 0) return vars;
  const chapter = storyboards[name].chapters[index];
  const t = frame - chapter.start;
  const set = (key: string, value: number) => {
    vars[`--${key}`] = value;
  };
  if (name === "intro") {
    const prefix = ["grpo", "rltt", "opd", "fixed", "dynamic"][index];
    for (const group of groups) set(group, group.startsWith(prefix) ? 1 : 0.22);
    const reveal = (key: string, cue: { start: number; duration: number }) =>
      set(
        `${prefix}-${key}`,
        mix(0.24, 1, rise(t, cue.start + cue.duration, introMotion.nodeFade)),
      );
    if (index < 2) {
      const cues = introMotion.recurrent;
      reveal("low", cues.input);
      reveal("middle", cues.next);
      reveal("high", cues.terminal);
      reveal("rollout", cues.rollout);
      reveal("reward", cues.reward);
    } else if (index === 3) {
      const cues = introMotion.fixed;
      reveal("student-low", cues.input);
      reveal("student-high", cues.next);
      reveal("rollout", cues.rollout);
      reveal("teacher-low", cues.context);
      reveal("teacher-middle", cues.teacherNext);
      reveal("teacher-high", cues.teacherTerminal);
    } else if (index === 4) {
      const cues = introMotion.dynamic;
      reveal("low", cues.input);
      reveal("middle", cues.next);
      reveal("rollout", cues.rollout);
      reveal("high", cues.terminal);
    }
  } else {
    const active =
      index === 0
        ? [
            "input",
            "student",
            "shared-frame",
            "shared-student-label",
            "shared-low",
            "shared-middle",
            "rollout",
            "tokens",
            "token",
          ]
        : index === 1
          ? ["frozen", "shared", "context", "tokens", "token", "input"]
          : index === 2
            ? [
                "loss",
                "teacher-flow",
                "frozen-high",
                "student-high",
                "shared-high",
                "shared-middle",
                "tokens",
                "token",
              ]
            : ["update", "student", "shared", "frozen"];
    for (const group of groups)
      set(group, active.some((key) => group.startsWith(key)) ? 1 : 0.3);
    if (index === 0) {
      const { student, nodeFade } = methodMotion;
      for (const key of ["student-low", "shared-low"])
        set(key, mix(0.3, 1, rise(t, student.lowOn, nodeFade)));
      for (const key of ["student-high", "shared-middle"])
        set(key, mix(0.3, 1, rise(t, student.highOn, nodeFade)));
      set("rollout", mix(0.3, 1, rise(t, student.rollout.start, nodeFade)));
      // Let the rollout arrive, pause for one second, then reveal tokens 1.2s apart.
      ["token-one", "token-two", "token-last"].forEach((key, i) =>
        set(
          key,
          mix(0.16, 1, rise(t, student.tokenOn + i * student.tokenSpacing)),
        ),
      );
    }
    if (index === 2) {
      const { distillation, nodeFade } = methodMotion;
      set("loss", mix(0.3, 1, rise(t, distillation.lossOn, nodeFade)));
    }
    if (index === 1) {
      const { teacher, nodeFade } = methodMotion;
      set("frozen-low", mix(0.3, 1, rise(t, teacher.lowOn, nodeFade)));
      set("frozen-middle", mix(0.3, 1, rise(t, teacher.middleOn, nodeFade)));
      for (const key of ["frozen-high", "shared-high"])
        set(key, mix(0.3, 1, rise(t, teacher.highOn, nodeFade)));
    }
  }
  // Original arrow shafts and heads must not inherit their model's highlight.
  // Keep the whole arrow faint while the moving trace reaches its destination;
  // only then restore the original path, using exactly the same timing cue.
  const arrowDim = name === "intro" ? 0.22 : 0.3;
  if (name === "intro") {
    for (const { route, start, duration } of introCues(index)) {
      const id = arrowGeometry.intro[route].id;
      set(
        `arrow-${id}`,
        mix(arrowDim, 1, rise(t, start + duration, introMotion.nodeFade)),
      );
      // Flow labels light up on departure, while destination nodes wait for arrival.
      const label = `label-${id}`;
      if (groups.includes(label))
        set(label, mix(arrowDim, 1, rise(t, start, introMotion.nodeFade)));
    }
  } else {
    for (const { route, start, duration } of methodCues(index))
      set(
        `arrow-${arrowGeometry.method[route].id}`,
        mix(arrowDim, 1, rise(t, start + duration, methodMotion.nodeFade)),
      );
  }
  return vars;
}

function opacities(
  name: FigureName,
  frame: number,
  groups: string[],
  focus: number | null,
) {
  const index = chapterAt(name, frame);
  if (index < 0) return {};
  const board = storyboards[name];
  const chapter = board.chapters[index];
  const current = chapterOpacities(name, index, frame, groups);
  const initial = chapterOpacities(name, index, chapter.start, groups);
  // Reset an isolated chapter during its closing hold. On restart, future
  // arrows and nodes are already dim instead of flashing their completed state.
  const previous =
    focus === index
      ? initial
      : chapterOpacities(name, index - 1, chapter.start - 1, groups);
  const enter = rise(frame, chapter.start, 12);
  // Only the end of the complete sequence returns to the original full figure.
  const exit =
    focus === index || index === board.chapters.length - 1
      ? rise(frame, chapter.end - 12, 12)
      : 0;
  for (const key of Object.keys(current)) {
    current[key] = mix(
      mix(previous[key] ?? 1, current[key], enter),
      focus === index ? initial[key] : 1,
      exit,
    );
  }
  return current;
}

export interface FigureCompositionProps {
  artwork: VectorAsset;
  name: FigureName;
  compact: boolean;
  variant: "both" | "fixed" | "dynamic";
  focus: number | null;
  crop?: Box;
}
export function FigureComposition({
  artwork,
  name,
  compact,
  variant,
  focus,
  crop,
}: FigureCompositionProps) {
  const cropId = `animation-crop-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = toTimelineFrame(useCurrentFrame());
  const storyboard = storyboards[name];
  const index = chapterAt(name, frame);
  const local = index < 0 ? 0 : frame - storyboard.chapters[index].start;
  let box: Box = storyboard.box;
  if (name === "intro" && (compact || focus !== null)) {
    const chapters = storyboards.intro.chapters;
    if (focus !== null) box = chapters[focus].box;
    else if (index >= 0) {
      box = mixBox(
        chapters[Math.max(0, index - 1)].box,
        chapters[index].box,
        rise(local, 0, 16),
      );
    } else {
      const last = chapters[chapters.length - 1];
      // Pan back during the closing hold so the next cycle starts on the same
      // crop. Mobile chapter changes must not teleport between distant panels.
      box =
        frame >= last.end
          ? mixBox(last.box, chapters[0].box, rise(frame, last.end, 36))
          : chapters[0].box;
    }
  }
  if (name === "method" && (compact || variant !== "both"))
    box = variant === "fixed" ? [0, 0, 334, 242] : [353, 0, 285.251, 242];
  if (crop) box = crop;
  const padded: Box = [box[0] - 4, box[1] - 4, box[2] + 8, box[3] + 8];
  const style = {
    ...opacities(name, frame, artwork.groups, focus),
    // Separators belong to the full comparison, not the cropped panel views.
    "--overview-dividers":
      name === "intro" && (compact || focus !== null) ? 0 : 1,
  } as CSSProperties;
  const alpha =
    index < 0
      ? 0
      : Math.min(
          rise(local, 0, 8),
          1 - rise(frame, storyboard.chapters[index].end - 10, 10),
        );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={padded.join(" ")}
      width="100%"
      height="100%"
      style={style}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={cropId}>
          <rect
            x={padded[0]}
            y={padded[1]}
            width={padded[2]}
            height={padded[3]}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cropId})`}>
        <VectorArtwork artwork={artwork} />
        <g opacity={alpha}>
          {name === "intro" ? (
            <IntroFlow chapter={index} frame={local} />
          ) : (
            <MethodFlow chapter={index} frame={local} />
          )}
        </g>
      </g>
    </svg>
  );
}

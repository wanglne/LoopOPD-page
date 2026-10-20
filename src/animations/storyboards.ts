export type FigureName = "intro" | "method";
export type Box = readonly [number, number, number, number];
export interface Chapter {
  label: string;
  title: string;
  description: string;
  start: number;
  end: number;
  box?: Box;
}
// Keep the authored timing at 30 ticks/s and render half-tick samples at 60 fps.
// Raising the playback frame rate must not shorten the narration or node holds.
export const TIMELINE_FPS = 30;
export const FPS = 60;
export const toPlayerFrame = (tick: number) =>
  Math.round((tick * FPS) / TIMELINE_FPS);
export const toTimelineFrame = (frame: number) => (frame * TIMELINE_FPS) / FPS;

const nodeFade = 12;
const nodeHold = 18;
const arrow = (start: number, duration = 24) => ({ start, duration });
const arrival = (cue: { start: number; duration: number }) =>
  cue.start + cue.duration;
const afterNode = (cue: { start: number; duration: number }, duration = 24) =>
  arrow(arrival(cue) + nodeFade + nodeHold, duration);
const studentInput = arrow(8);
const studentNextLoop = afterNode(studentInput);
const studentRollout = afterNode(studentNextLoop, 30);
const teacherContext = arrow(8, 36);
const teacherNextLoop = afterNode(teacherContext);
const teacherEllipsis = afterNode(teacherNextLoop, 18);
const teacherTerminal = arrow(arrival(teacherEllipsis) + 8, 18);
const distillationSignals = arrow(8, 40);

// The overview follows the same arrival -> reveal -> hold order as the method.
// Short ellipsis segments represent omitted loops, not another displayed node.
const overviewInput = arrow(16);
const overviewNext = afterNode(overviewInput);
const overviewEllipsis = afterNode(overviewNext, 18);
const overviewTerminal = arrow(arrival(overviewEllipsis) + 8, 18);
const overviewRollout = afterNode(overviewTerminal);
const overviewReward = afterNode(overviewRollout);
const overviewFeedback = afterNode(overviewReward, 36);
const fixedRollout = afterNode(overviewNext);
const fixedContext = afterNode(fixedRollout, 30);
const fixedTeacherNext = afterNode(fixedContext);
const fixedTeacherEllipsis = afterNode(fixedTeacherNext, 18);
const fixedTeacherTerminal = arrow(arrival(fixedTeacherEllipsis) + 8, 18);
const fixedSupervision = afterNode(fixedTeacherTerminal, 36);
const dynamicTerminal = afterNode(fixedRollout);
const dynamicSupervision = afterNode(dynamicTerminal, 36);
const dynamicRefresh = afterNode(dynamicSupervision, 36);

export const introMotion = {
  nodeFade,
  recurrent: {
    input: overviewInput,
    next: overviewNext,
    ellipsis: overviewEllipsis,
    terminal: overviewTerminal,
    rollout: overviewRollout,
    reward: overviewReward,
    // All four RLTT feedback paths share this departure and arrival time.
    feedback: overviewFeedback,
  },
  fixed: {
    input: overviewInput,
    next: overviewNext,
    rollout: fixedRollout,
    context: fixedContext,
    teacherNext: fixedTeacherNext,
    teacherEllipsis: fixedTeacherEllipsis,
    teacherTerminal: fixedTeacherTerminal,
    supervision: fixedSupervision,
  },
  dynamic: {
    input: overviewInput,
    next: overviewNext,
    rollout: fixedRollout,
    terminal: dynamicTerminal,
    supervision: dynamicSupervision,
    refresh: dynamicRefresh,
  },
};
const finishOverviewChapter = (cue: { start: number; duration: number }) =>
  arrival(cue) + nodeFade + nodeHold + 12;
const grpoEnd = 45 + finishOverviewChapter(overviewFeedback);
const rlttEnd = grpoEnd + finishOverviewChapter(overviewFeedback);
const opdEnd = rlttEnd + 180;
const fixedEnd = opdEnd + finishOverviewChapter(fixedSupervision);
const dynamicEnd = fixedEnd + finishOverviewChapter(dynamicRefresh);

// Arrow arrival, node reveal, and the next departure share one timeline.
export const methodMotion = {
  nodeFade,
  student: {
    input: studentInput,
    nextLoop: studentNextLoop,
    rollout: studentRollout,
    lowOn: arrival(studentInput),
    highOn: arrival(studentNextLoop),
    tokenOn: arrival(studentRollout) + TIMELINE_FPS,
    tokenSpacing: 36,
  },
  teacher: {
    context: teacherContext,
    nextLoop: teacherNextLoop,
    ellipsis: teacherEllipsis,
    terminal: teacherTerminal,
    lowOn: arrival(teacherContext),
    middleOn: arrival(teacherNextLoop),
    highOn: arrival(teacherTerminal),
  },
  distillation: {
    signals: distillationSignals,
    lossOn: arrival(distillationSignals),
  },
};
const rolloutEnd = 45 + methodMotion.student.tokenOn + 2 * 36 + 16 + 36;
const teacherEnd = rolloutEnd + methodMotion.teacher.highOn + nodeFade + 56;
const distillationEnd = teacherEnd + 165;
const updateEnd = distillationEnd + 195;

export const storyboards = {
  intro: {
    title: "Explore the overview",
    fullTitle: "From recurrent computation to recurrent self-improvement",
    fullDescription:
      "LoopOPD uses a model’s deeper loop as a teacher. D-LoopOPD refreshes that teacher through shared parameter updates, turning additional computation into an evolving source of supervision.",
    duration: dynamicEnd + 45,
    box: [0, 0, 803.71, 287.105] as Box,
    chapters: [
      {
        label: "GRPO",
        title: "GRPO: sparse terminal loop credit",
        description:
          "GRPO generates rollouts using the terminal loop policy and computes advantages from outcome rewards. Direct reward supervision is applied only to the terminal loop.",
        start: 45,
        end: grpoEnd,
        box: [0, 26, 128, 257] as Box,
      },
      {
        label: "RLTT",
        title: "RLTT: credit across loops, with a memory cost",
        description:
          "RLTT extends reward credit across recurrent loops, but retaining per-loop log-probabilities increases memory usage with the number of loops, limiting long rollout training.",
        start: grpoEnd,
        end: rlttEnd,
        box: [131, 26, 148, 257] as Box,
      },
      {
        label: "OPD",
        title: "OPD: the external teacher bottleneck",
        description:
          "Conventional OPD relies on a stronger external teacher. For Ouro-2.6B-Thinking, no stronger teacher from the same LoopLM family is available, limiting its applicability.",
        start: rlttEnd,
        end: opdEnd,
        box: [282, 26, 139, 257] as Box,
      },
      {
        label: "LoopOPD",
        title: "LoopOPD: a teacher from deeper computation",
        description:
          "The intermediate loop student generates rollouts. A frozen copy of the initial model uses more recurrent computation to provide dense supervision on the same student generated prefixes.",
        start: opdEnd,
        end: fixedEnd,
        box: [434, 29, 190, 218] as Box,
      },
      {
        label: "D-LoopOPD",
        title: "D-LoopOPD: supervision that evolves with the student",
        description:
          "The deeper policy supervises the intermediate policy. Their shared parameters are updated through the student, refreshing the teacher for the next optimization step.",
        start: fixedEnd,
        end: dynamicEnd,
        box: [630, 29, 173.71, 218] as Box,
      },
    ] satisfies Chapter[],
  },
  method: {
    title: "Explore the training process",
    fullTitle: "Cross-loop distillation with a fixed or dynamic teacher",
    fullDescription:
      "Both variants learn from a deeper loop teacher on student generated response prefixes. LoopOPD keeps its teacher frozen;\nD-LoopOPD refreshes its teacher through shared parameter updates.",
    duration: updateEnd + 45,
    box: [0, 0, 638.251, 275.07] as Box,
    chapters: [
      {
        label: "Student rollout",
        title: "1. Generate the student’s own trajectory",
        description:
          "Given a prompt x, the intermediate loop student samples a response y. Distillation is performed on these student generated response prefixes.",
        start: 45,
        end: rolloutEnd,
      },
      {
        label: "Deeper teacher",
        title: "2. Evaluate the same prefixes with more loops",
        description:
          "The terminal loop teacher evaluates the same prompt and response prefixes. LoopOPD uses a frozen initial teacher;\nD-LoopOPD uses the current terminal policy with a stop gradient target.",
        start: rolloutEnd,
        end: teacherEnd,
      },
      {
        label: "Reverse KL",
        title: "3. Distill next token distributions",
        description:
          "Reverse KL distillation trains the student's next token distribution toward the teacher's distribution. The teacher's advantage comes from additional recurrent computation, without privileged context or a larger external model.",
        start: teacherEnd,
        end: distillationEnd,
      },
      {
        label: "Update & refresh",
        title: "4. Update the student, refresh the dynamic teacher",
        description:
          "Gradients flow through the student, not the teacher target. LoopOPD’s teacher stays frozen. In D-LoopOPD, the shared parameter update also changes the terminal policy used as the next teacher.",
        start: distillationEnd,
        end: updateEnd,
      },
    ] satisfies Chapter[],
  },
};
export function chapterAt(name: FigureName, frame: number): number {
  return storyboards[name].chapters.findIndex(
    (chapter) => frame >= chapter.start && frame < chapter.end,
  );
}

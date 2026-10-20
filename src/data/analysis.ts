export const analyses = [
  {
    id: "depth",
    label: "Across loop depths",
    title: "Supervise one loop, improve all four",
    description:
      "D-LoopOPD improves AIME 2024 Avg@16 over the vanilla model at every evaluated depth. Loop 2 receives the distillation objective; the gains extend to the terminal loop through shared parameters.",
    source: "Table 5 · Ouro-2.6B-Thinking · AIME 2024 Avg@16 (%)",
    axis: "Recurrent loop depth",
    labels: ["Loop 1", "Loop 2", "Loop 3", "Loop 4"],
    series: [
      {
        name: "Vanilla",
        color: "#8b96a8",
        values: [0.63, 39.16, 61.46, 62.08],
      },
      { name: "RLTT", color: "#5e9492", values: [0.0, 26.87, 49.58, 56.67] },
      { name: "GRPO", color: "#82a8d0", values: [0.42, 41.88, 62.92, 62.92] },
      {
        name: "LoopOPD",
        color: "#28558c",
        values: [1.25, 45.62, 63.33, 65.21],
      },
      {
        name: "D-LoopOPD",
        color: "#b18115",
        values: [1.88, 47.5, 66.87, 71.67],
      },
    ],
  },
  {
    id: "budget",
    label: "Decode budget",
    title: "Gains Across Decode Budgets",
    description:
      "RLTT improves short budget performance but falls below vanilla at 16K and 31K. In contrast, D-LoopOPD exceeds vanilla across all decode budgets, reaching 71.67% at 31K compared with 62.08% for vanilla. These results suggest that D-LoopOPD improves reasoning performance across decoding budgets without sacrificing long budget capability for short budget gains.",
    source: "Table 6 · Ouro-2.6B-Thinking · AIME 2024 Avg@16 (%)",
    axis: "Maximum decode budget (tokens)",
    labels: ["1K", "2K", "4K", "8K", "16K", "31K"],
    series: [
      {
        name: "Vanilla",
        color: "#8b96a8",
        values: [0.0, 3.75, 13.95, 32.29, 55.0, 62.08],
      },
      {
        name: "RLTT",
        color: "#5e9492",
        values: [4.38, 23.33, 34.16, 45.21, 53.95, 56.67],
      },
      {
        name: "D-LoopOPD",
        color: "#b18115",
        values: [0.0, 3.96, 16.87, 36.45, 58.33, 71.67],
      },
    ],
  },
  {
    id: "student",
    label: "Student depth",
    title: "Loop 2 provides the strongest terminal loop gain",
    description:
      "These results suggest a balance between student capability and the teacher's advantage from additional recurrent computation. Among student loops 1, 2, and 3, supervising loop 2 yields the highest terminal loop AIME 2024 Avg@16.",
    source:
      "Figure 5 · Ouro-2.6B-Thinking · Terminal-loop AIME 2024 Avg@16 (%)",
    axis: "Student loop used in D-LoopOPD",
    labels: ["Loop 1", "Loop 2", "Loop 3"],
    series: [
      {
        name: "Vanilla terminal loop",
        color: "#8b96a8",
        values: [62.08, 62.08, 62.08],
      },
      {
        name: "Trained terminal loop",
        color: "#b18115",
        values: [68.54, 71.67, 67.29],
      },
    ],
  },
];

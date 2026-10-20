# LoopOPD project page

Project page for **Recurrent Self-Improvement: Dynamic Cross-Loop On-Policy Distillation for Looped Language Models**.

- [Paper](https://arxiv.org/pdf/2610.10623)
- [arXiv](https://arxiv.org/abs/2610.10623)
- Code and models: coming soon.

## Local development

Use Node.js 24 or later.

```bash
npm ci
npm run dev
```

```bash
npm run build
npm run lint
```

The GitHub Actions workflow deploys to GitHub Pages after a push to `main`. Set the repository's **Settings → Pages → Source** to **GitHub Actions**. Asset URLs support the `/LoopOPD-page/` base path.

## Editing the page

- `src/paper.mdx`: page metadata, Impact, section text, and citation.
- `src/components/Header.astro`: title, authors, affiliations, and the four resource buttons. Add URLs to the Code and Models entries when they become available.
- `src/animations/storyboards.ts`: animation chapters, explanations, timing, and focus regions.
- `src/animations/FigureComposition.tsx`: Remotion compositions; node activation, flow paths, distillation, and teacher refresh.
- `src/animations/arrow-geometry.json`: original SVG arrow outlines and their centerlines, used to keep animation paths aligned with the paper figures.
- `src/animations/*-vectors.json`: semantic layers of the original vector artwork, corresponding to slides 1 and 2 of the source PowerPoint. Text and equations remain outlined vectors.
- `src/components/AnimatedFigure.tsx`: playback, progress, chapter selection, and method comparison controls.
- `src/components/MethodTeaser.tsx`: the automatic method animation between the navigation and headline results, with a stacked layout on mobile and no playback controls.
- `src/components/PaperFigure.astro`: lazy-loaded figure wrapper and original asset URLs.
- `src/data/results.json`: values from Tables 2 and 3, including Qwen reference models.
- `src/components/Results.astro`: result categories and model controls.
- `src/components/ResultsTable.astro`: accessible table rendering.
- `src/data/analysis.ts`: values and descriptions for cross-loop performance, decode budgets, and student-depth ablations.
- `src/components/Analysis.astro`: interactive analysis charts and exact-value tables.
- `src/styles/loopopd.css`: yellow and blue palette, typography, and responsive layout.
- `public/figures/`: vector exports of the original PDF figures.
- `public/social-preview.png`: link-preview cover.
- `public/loopopd-favicon.svg`: browser-tab icon.

The page follows **Impact → Overview → Methodology → Results → Citation**, using the layout and typography of the SaLR project page. Table values follow the paper's tables. Scores retain their original metric definitions: Avg@16 and Pass@16 are distinct. Cross-loop and decode-budget charts use Tables 5 and 6; the student-depth analysis uses Figure 5. The default model is Ouro-2.6B-Thinking.

The figures use [Remotion Player](https://www.remotion.dev/docs/player) with frame-based SVG compositions. The method animation below the navigation loops automatically without controls. In the Overview and Methodology sections, choose **Play animation** for the full sequence, or select a chapter to inspect and loop that step. **Original figure** preserves the paper artwork. The method player also supports side-by-side and individual variant views. Playback pauses offscreen and in background tabs; the top animation resumes when visible again. All players preserve a static fallback and default to the original figure with reduced motion enabled. Tables and figure controls support keyboard navigation. All external links open in a new tab.

Fonts are served locally, with their license notices in `public/fonts/`.

Built on [Roman Hauksson-Neill's academic project page template](https://research-template.roman.technology/).

# LoopOPD project page

This is an Astro 6 static project page with MDX content, React islands, and Remotion SVG animations. Use Node.js 24 or later.

## Content and components

- `src/paper.mdx` contains page metadata, section text, and the BibTeX citation.
- `src/components/Header.astro` contains the title, authors, affiliations, and resource links.
- `src/components/Results.astro` and `ResultsTable.astro` render the model comparison from `src/data/results.json`.
- `src/components/Analysis.astro` renders the charts and exact-value tables from `src/data/analysis.ts`.
- `src/animations/storyboards.ts` contains animation text and timing. `FigureComposition.tsx`, the vector JSON files, and `arrow-geometry.json` render the original artwork.
- `src/components/AnimatedFigure.tsx` provides figure controls; `MethodTeaser.tsx` provides the automatic header animation.
- `src/styles/loopopd.css` contains the yellow and blue theme and responsive layout.

## Development and checks

Run `npm ci`, then `npm run dev`. Before release, run `npm run build` and `npm run lint`. Check both desktop and mobile layouts when changing presentation or interactions. Keep temporary screenshots and review scripts outside the repository.

Preserve scientific values and the distinction between Avg@16 and Pass@16. Keep the static SVG fallback and reduced-motion behavior. Switching result and analysis tabs should not scroll the page.

## Assets and deployment

Public asset URLs must include `import.meta.env.BASE_URL`. The GitHub Pages workflow passes `--site` and `--base` when building. The layout derives canonical and social-image URLs from those values.

Keep the original figure SVGs for static fallback, `public/social-preview.png` for link previews, and both local fonts and their license notices. External page links open in a new tab with `rel="noopener noreferrer"`. Code and Models remain marked Coming soon until URLs are supplied.

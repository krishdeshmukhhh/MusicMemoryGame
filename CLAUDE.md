# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

There is no test suite.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Supabase is optional for local development — API routes degrade gracefully when env vars are absent.

## Architecture

### Single interactive shell
Every game route (`/`, `/bpm`, `/bpm/articles`, `/bpm/scoring`, `/articles`, `/scoring`) renders the same `<GameClient />` component. There is no page-level navigation — only one React tree is ever mounted. A lazy `useState` initializer reads `window.location.pathname` at boot to set the initial `homeView`.

`homeView` drives which card content is visible. Switching views calls `switchView(target)`, which fades out (250ms), swaps `homeView`, fades in, and calls `history.pushState()` to sync the URL — **never use `router.push()`** for in-app navigation. A `popstate` listener handles browser back/forward.

### Card height animation
The centre card animates its height via `transition-[max-width,height]` with a `cardHeight` value read from `cardInnerRef.scrollHeight`. Every time `homeView` changes, height is remeasured after the fade.

### BPM game isolation
All BPM state and audio lives in `hooks/useBpmGame.ts`. `GameClient.tsx` only passes props down to `<BpmGame />`. The hook uses the Web Audio API directly (no Tone.js): a 25ms `setInterval` scheduler fills a 150ms lookahead buffer of `OscillatorNode` clicks; visual pulses are driven by `setTimeout` at the same offsets and remount animated elements via a `key={pulseKey}` increment trick.

### Pitch game audio
`lib/audio.ts` exports a singleton `engine` (Tone.js `PolySynth` → `FeedbackDelay` → `Reverb`). It must be initialised by a user gesture (`engine.init()`). A silent warmup chord is triggered on init to pre-JIT Web Audio nodes and prevent timing drift on the first real sequence.

### Daily determinism
Both games generate daily sequences with the Mulberry32 PRNG from `lib/seed.ts`. Seeds are strings hashed via `stringToSeed()`:
- Pitch: `"YYYY-MM-DD-R{round}"` → 4-note sequence per round
- BPM: `"YYYY-MM-DD-bpm-R{round}"` → 5-round BPM sequence

This means **the same date string always produces the same sequence for all players**.

### Scoring
- **Pitch** — `scoreNote()` in `lib/seed.ts`: perfect = 2.5 pts, exponential decay by semitone distance. 4 notes × 5 rounds = 50 pts max.
- **BPM** — `scoreGuess()` inside `useBpmGame.ts`: linear interpolation within percentage-off tiers (≤3% Perfect → ≤25% Close). 5 rounds = 20.00 pts max.

### Styling conventions
Tailwind v4 with `@theme` CSS variables defined in `app/globals.css`. Use semantic tokens (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-text-muted`, `text-text-faint`, `border-border`) rather than raw Tailwind colours. Pitch accent = purple; BPM accent = orange. Display font = `font-display` (Zodiak); body = Satoshi (default).

### API routes
All routes are under `app/api/`. They use the Supabase service role key (server-side only). The `stats/global` and `stats/bpm-global` routes are cached for 60s and include a +500 baseline offset on the BPM global count.

# pitchd. — Implementation Ideas

> Living doc. Update this whenever an idea is discussed or completed. Mark done items ✅.

---

## 🐛 Bugs to Fix

### ✅ Double score POST (Priority: High)
Removed the fire-and-forget `fetch('/api/scores', ...)` from `handleRevealComplete`. `postScore` is now the only submission path.

---

## 🎨 UX / Polish

### ✅ Replace `alert()` with toast notifications (Priority: High)
Created `components/Toast.tsx` — module-level `showToast()` function, fixed bottom-centre pill, auto-dismisses after 2.8s, slide-up animation. Replaced all 3 `alert()` calls in GameClient.

### ✅ BPM best score on final screen
Shows "🎉 New Personal Best!" on the BPM final screen when the player beats their all-time record. Daily streak also shown when > 1.

### ✅ BPM scoring widened — more accessible
Tiers doubled from 1.5/4/8/15% to 3/8/15/25%. At 100 BPM: Perfect ≤3 BPM, Great ≤8 BPM, Good ≤15 BPM, Close ≤25 BPM.

---

## 🆕 Features

### ✅ Real BPM article pages (Priority: High — SEO gap)
Created `app/bpm/articles/[slug]/page.tsx` with all 3 full articles (6 sections each), `generateStaticParams`, `generateMetadata`, `Article` + `BreadcrumbList` JSON-LD. Converted `BPM_ARTICLES_DATA` in GameClient from plain `<div>` to `<Link>` with hover styles. Added all 3 slugs to sitemap. Also fixed TypeScript build error (`item.range` on type `never` in BPM scoring view).

### ✅ Articles render inside card
Articles open inside the GameClient card instead of navigating away. Article data extracted to `lib/pitch-articles.ts` and `lib/bpm-articles.ts` (shared with standalone SEO pages). Standalone pages still exist for direct URL access and SEO.

### ✅ BPM worldwide stats via Supabase
`app/api/bpm-sessions/route.ts` records completed BPM games. `app/api/stats/bpm-global/route.ts` returns live count. GameClient auto-POSTs a session when bpmPhase hits 'final'. BPM idle screen shows live worldwide count with orange pulsing dot.

### ✅ BPM stats view
Full stats card (Played / Best / Daily Streak + score history bar chart). Accessible via BarChart2 icon on BPM idle screen. Bar chart uses orange hover colour, scaled to max 20.00.

### ✅ Daily BPM challenge
`getDailyBpmSequence` in `lib/seed.ts` uses Mulberry32 PRNG seeded with `"YYYY-MM-DD-bpm-RN"` to produce a deterministic 5-BPM sequence per day. Mode toggle (Practice / Daily) on idle screen. Daily mode tracks streak in localStorage (`bpm_daily_streak`, `bpm_last_daily_date`). Shows "Today's challenge complete" when already played today.

### ✅ Replay tempo button
One-use "Replay (1×)" button in BPM guessing phase. Replays the target BPM metronome for 2 seconds then resumes slider metronome. Slider is disabled during replay. Grays out after use.

### ✅ Tap tempo input
"Slider / Tap" tab switcher in BPM guessing phase. Tap mode records inter-tap intervals, averages them, and sets BPM live. Resets after 2 seconds of inactivity.

### ✅ Keyboard shortcut hint
Music icon near Undo button (desktop only, hover to show) reveals the full key→note mapping in a tooltip.

---

## 🔍 SEO

### OG image route (Priority: High)
No dynamic OG images exist — `og:image` currently points to a static asset. Add `/api/og` using `@vercel/og` (ImageResponse) to generate per-page images. Pitch home, BPM home, and article pages should each have a distinct image with the page title and pitchd. branding. This directly impacts click-through rate from social shares and Google Discover.

### Canonical URLs missing on inner pages (Priority: Medium)
`/bpm/scoring`, `/scoring`, `/bpm/articles`, `/articles` don't set `alternates.canonical` in their metadata. Google may see the in-card view and the standalone page as duplicates. Add `canonical` to each page's `generateMetadata`.

### More BPM articles (Priority: Medium — SEO gap)
3 BPM articles vs 6 pitch articles. Each article is an indexable landing page. Targets: "how to improve rhythm", "bpm counter online", "tap tempo test", "metronome ear training". New articles = new long-tail keyword surfaces.

### HowTo schema on scoring pages (Priority: Low)
`/scoring` and `/bpm/scoring` explain a process step by step — a perfect fit for `HowTo` JSON-LD. Replaces or supplements the current bare `FAQPage` schema. Google can show this in rich results.

### Internal linking in articles (Priority: Low)
Articles don't link to each other or back to the game. Add a "Related articles" section at the bottom of each article and an inline CTA to the game. This passes PageRank between article pages and improves crawl depth.

---

## 🆕 Ideas / Future

### OG image per page — `/api/og` (Priority: High)
See SEO section above. Use `@vercel/og` with ImageResponse. Pitch home: purple accent + pitchd. wordmark + "5-round pitch game". BPM home: orange accent + bpm. wordmark. Article pages: article title + date. This is a one-afternoon implementation with a high SEO and social payoff.

### "Daily already played" gate for pitch (Priority: Medium)
BPM shows "Come back tomorrow" when daily is done. Pitch has no such gate — you can grind the same daily sequence infinitely and re-submit to the leaderboard. Check `pitchd_last_played` in `handleStart` and show a "You've played today's daily — come back tomorrow" message (with an Endless escape hatch). Keeps the daily leaderboard fair.

### Confetti on perfect round / perfect game (Priority: Medium)
A perfect BPM round (4.00 pts) or perfect pitch round (10.00 pts) or a perfect overall game deserves a moment. Use `canvas-confetti` (tiny, tree-shakeable). Trigger on `isNewBpmBest` or `finalTotal === 50` / `finalTotal === 20`.

### BPM leaderboard (Priority: Low)
Show top BPM scores globally, similar to the pitch leaderboard. Requires `bpm_sessions` to store initials. Add an initials input on the BPM final screen.

### Share BPM daily result (Priority: Low)
Emoji grid share card for daily BPM. Show date + round-by-round emojis + total. Already have the share infrastructure from pitch — copy the pattern.

### First-time onboarding tooltip (Priority: Low)
New visitors see no instructions. A one-time dismissable banner or pulsing "?" button that reveals a 3-step how-to-play overlay (listen → guess → score). Store dismiss state in localStorage so it doesn't re-appear.

### Pitch score history graph improvement (Priority: Low)
The pitch bar chart scales to 50 pts but shows no axis labels or median line. Add a faint midpoint line at 25 pts and a "best" marker so users can track improvement at a glance.

### Streak freeze mechanic (Priority: Low)
Players lose streaks when they forget to play one day. A "streak freeze" (one per week, auto-granted) would reduce churn from casual users who miss a day and feel punished. Store `pitchd_streak_freeze` in localStorage.

---

---

## 🧹 Cleanup

### ✅ Delete orphaned files
Deleted `components/AppShell.tsx` and `components/BpmGame.tsx` — were for an abandoned tab architecture, not imported anywhere.

---

## ✅ Completed

- ✅ BPM Guesser game mode (listen → slider → score, 5 rounds)
- ✅ Live metronome during guessing phase (slider updates BPM in real time)
- ✅ Beat-synced visual pulse (ring + dot animations, `key={pulseKey}` remount trick)
- ✅ Top mode-switcher navbar (Pitch / BPM pill)
- ✅ Context-aware Articles/Scoring navbar links
- ✅ BPM routes: `/bpm`, `/bpm/articles`, `/bpm/scoring` as proper Next.js pages
- ✅ Continuous decimal BPM scoring (linear interpolation within each tier)
- ✅ Wider BPM scoring tiers (3/8/15/25%)
- ✅ SEO: Full JSON-LD, BreadcrumbList, sitemap, keywords sitewide
- ✅ Bug fix: removed double score POST
- ✅ Toast notifications replacing all `alert()` calls
- ✅ Real BPM articles at `/bpm/articles/[slug]`
- ✅ Articles render inside card (lib/pitch-articles.ts, lib/bpm-articles.ts)
- ✅ BPM worldwide stats via Supabase
- ✅ BPM personal stats on idle screen + full stats view
- ✅ Daily BPM challenge with streak tracking
- ✅ Replay tempo button (one-use, 2s)
- ✅ Tap tempo input
- ✅ Keyboard shortcut tooltip
- ✅ BPM new best badge on final screen
- ✅ Orphaned file cleanup (AppShell, BpmGame)

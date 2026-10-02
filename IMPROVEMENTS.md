# pitchd. — Growth & Engineering Improvements

_Last updated: 2026-10-02_

This doc has three parts:

1. **What shipped in this pass**: already implemented, tested and verified in a production build.
2. **What you need to do before or at deploy**: steps that need your accounts or a decision from you.
3. **Recommended next moves**: ranked by expected impact on users, with effort estimates.

---

## 1. Shipped in this pass

### Growth loop: sharing was broken in three places
| Problem | Impact | Fix |
|---|---|---|
| `/share` called `redirect('/')`, so Discord, iMessage, X and WhatsApp crawlers got a 307 and **never saw the score card** | The viral loop's preview image never showed | `/share` is now a real "A friend challenged you → **Beat this score**" landing page with a per-result OG image (noindex) |
| Pitch results could **only be shared after submitting to the leaderboard**, and the copied text was missing the percentile (stale React state) | Most players never shared | An always-visible **Share Result** button; percentile included once posted |
| BPM share linked to the bare homepage with no card | BPM shares didn't convert | BPM shares link to `/share?game=bpm…` with an orange BPM result card |
| Copy-to-clipboard only | Weak on mobile, where most sharing happens | `navigator.share()` native share sheet on touch devices, clipboard on desktop |
| Share text had no identity | Hard to recognise in a group chat | Wordle-style `pitchd #188 — 38.50/50` plus a **per-note** emoji grid (🟩 exact · 🟦 octave · 🟨 close · 🟥 miss) |

### Retention: the Wordle mechanics
- **One daily per day, for both games.** The pitch daily could be replayed endlessly, including resubmitting to the leaderboard. After playing, the menu now shows today's score, **Share**, **Play Endless**, and a **"Next puzzle in 07:19:42"** countdown.
- **Streak bugs fixed.** The pitch streak used UTC dates while the puzzle used local dates, so US evening players saw streaks break or double-count. Everything is local-date now. Lapsed streaks no longer display (the menu used to show 🔥12 months later).
- **Midnight rollover.** A game started at 23:59 used to switch puzzles mid-game. The puzzle date is now locked at game start.
- **No way back to the menu after a game** (only a reload worked). Added **Back to Menu**.

### Leaderboard integrity (makes "Top 3% today" mean something)
- The leaderboard showed the **all-time** top 10 while the UI said "today". It is now today's top 10 for the player's local puzzle date, with an empty state ("be the first").
- **Scores are verified server-side.** The client sends the 20 notes played; the server recomputes the score against the deterministic daily answer. A forged `score: 50` is impossible, and only dates that are currently "today" somewhere on Earth are accepted.
- Endless-mode scores can no longer be posted to the daily board.
- Deleted `/api/daily`, which served every day's answers to anyone.
- All API inputs (device ID, initials, scores, dates) are sanitised. Initials are restricted to `A–Z0–9`, max 3.
- Every completed game (daily and endless) is now counted in `game_sessions`. Previously only games submitted to the leaderboard were counted.

### SEO: real bugs found in the built HTML
| Bug | Fix |
|---|---|
| Every subpage title had a doubled suffix: `BPM Guesser … \| pitchd. \| pitchd.` | One suffix, applied by the layout template |
| `/articles` and `/bpm/articles` had **zero crawlable links** (list items were `<button>`s) | Real `<a href>` links (15 + 15) that still open in-card on a plain click |
| The 15 BPM articles were linked only from the sitemap | Linked from the home page (30 article links now) |
| Article pages marked headings like "Introduction" up as **FAQPage** questions, a structured-data misuse that risks a manual action | Removed; Article + BreadcrumbList kept |
| `WebSite` `SearchAction` pointed at a search page that doesn't exist | Removed |
| Root `canonical: '/'` was inherited by pages without their own | Canonical set per page |
| Articles had no OG image (or the generic one) | Per-article title cards from `/api/og?title=…` |
| In-card articles had no URL (not shareable or bookmarkable) | They push `/articles/<slug>`, and back/forward work |
| `theme-color` set through `other` (deprecated) | `viewport` export |
| `robots.txt` allowed `/api/*` and `/share` | Both disallowed, except `/api/og` |

### Performance: initial JS cut by 51%
**Initial JavaScript, gzipped: 465 KB → 228 KB** (both figures measured from production builds of the old and new code).
- three.js (125 KB gz) is lazy-loaded after hydration. It also had a **render loop that never stopped** (no `cancelAnimationFrame`), and it now respects `prefers-reduced-motion`.
- Tone.js (78 KB gz) is downloaded during idle time and started on the first tap. The iOS gesture requirement is handled.
- Article bodies (27 KB gz) load only when an article is opened. The article listing was duplicated by hand in `GameClient.tsx`; it is now derived from the data files.

### Code health
- ESLint: **32 errors + 11 warnings → 0**. This included React "refs updated during render" in the BPM hook and side effects inside a `setState` updater, which double-counted games under StrictMode.
- **Test suite added** (Vitest, `npm test`): 49 tests across scoring, daily determinism (pinned against the *original* implementation, so no player's puzzle changed), dates/streaks/DST/leap years, share encoding, server-side validation, and article data.
- Game rules moved into pure, testable modules: `lib/bpm.ts`, `lib/daily.ts`, `lib/share.ts`, `lib/validate.ts`, `lib/articles.ts`, `lib/supabase.ts`.
- Removed: `README.md`, `app.md`, `implementation.md`, `pitchdv2.md` (stale, with the wrong domain and wrong formulas), 5 unused Next.js starter SVGs, the unused `@clerk/nextjs` dependency, and empty `api/stats/global` and `api/stats/bpm-global` folders. `@types/three` moved to devDependencies; `@types/node` aligned to Node 22.
- `CLAUDE.md` updated to match the new architecture.

### Analytics
Vercel Analytics custom events: `game_start`, `game_complete`, `score_submit`, `share`, `article_open`. Together they give you a funnel: visit → start → complete → share.

---

## 2. Before or at deploy: needs you

1. ~~**Run `supabase/schema.sql` in the Supabase SQL editor.**~~ Done (2026-10-02). It is idempotent. It drops the old `Anyone can insert scores` policy (which let anyone holding the anon key bypass server verification), creates `bpm_sessions` if missing, and adds a leaderboard index. The app works without it, but the migration closes the hole.
2. **Vercel custom events need the Pro plan.** On Hobby, `track()` calls are dropped silently. If you stay on Hobby, consider Plausible or PostHog (free tier) so you can see the share funnel.
3. ~~Check the `@pitchd` X handle~~ Done: removed, since you don't own it.
4. **One-time streak effect.** Players who last played on a UTC-vs-local date boundary may see their streak reset once after deploy. If that matters to you, a one-line grace rule can handle it.
5. `README.md` was deleted as requested. GitHub will show no readme for the repo; `CLAUDE.md` holds the architecture notes.

---

## 3. Recommended next moves (ranked)

Impact: ★★★ = likely to move weekly users noticeably; ★ = polish. Effort: S < 1 day, M 1–3 days, L > 3 days.

### ★★★ Free tool pages that capture search intent (M)
The articles target informational keywords, but the highest-volume searches in this niche are **tools**: "tap tempo", "bpm counter", "online metronome", "perfect pitch test", "tone generator", "interval trainer". Build `/tools/tap-tempo`, `/tools/metronome` and `/tools/perfect-pitch-test`, each a small, fast, server-rendered page with the tool above the fold and a "Now test yourself → play today's bpm." CTA. You already have the audio engines (`useBpmGame` click scheduler, Tone synth). This is the single biggest SEO lever available.

### ★★★ "Challenge a friend" seeded games (S–M)
Endless games are random, so a friend can't play the same one. Add `?seed=abc123` to share links for endless and practice games (the PRNG already takes string seeds) so the recipient plays **the identical sequence** and sees "You 41.20 vs Sam 38.50". Head-to-head is the strongest viral mechanic after a daily puzzle.

### ★★★ Distribution (S each, ongoing)
The product is now share-ready, so it needs eyes on it:
- **Reddit**: r/musictheory, r/ear_training, r/WeAreTheMusicMakers, r/edmproduction (BPM), r/Drumming (BPM), r/WordleGames. Post as a maker with a specific hook ("I made a daily Wordle for your ears; today's is #188").
- **Show HN** (the deterministic-seed and server-verification story fits HN well), and Product Hunt.
- **Short-form video** (@krishdevlog): "Can you beat 40/50?" screen recordings. Ear-test content performs very well on TikTok and Reels.
- **Wordle-alternative directories and lists** (several sites list "Games like Wordle"; submit to all of them) for backlinks plus steady traffic.
- **Music teachers**: a "classroom mode" or embeddable widget (below) gives them a reason to share it with students.

### ★★ Daily reminder (M)
Wordle-style games live or die on day-2 and day-7 return. Options: web push through the existing PWA manifest (service worker + VAPID; ask only *after* the first completed daily, never on load), or a one-field email reminder. Track `game_start` by returning device to measure it.

### ★★ Archive: play past dailies (M)
Every past puzzle is already deterministic. `/archive/2026-09-14` gives new players a backlog to binge (proven in Wordle clones), plus indexable pages ("pitchd #170").

### ★★ BPM leaderboard with verification (S–M)
The BPM daily is deterministic too, so the server can verify the 5 guesses exactly as it now verifies pitch notes. Add initials on the BPM final screen and a "Today's top 10" view. Right now BPM has no competitive hook.

### ★★ First-visit onboarding (S)
New visitors get two paragraphs of text. A 3-step overlay (Listen → Play it back → Score), or a 5-second auto-playing demo of the reveal, would lift start rate. Measure it with `game_start / pageviews`.

### ★★ Make the hidden SEO content visible (S)
The home and BPM pages carry `sr-only` explanatory text and links for crawlers. Google tolerates this for accessibility, but visually hidden keyword-rich text is a cloaking risk. Move it into a visible "How it works / FAQ" section below the card (the page would need to scroll), or into the scoring views.

### ★★ Author entity for E-E-A-T (S)
Articles are authored by "pitchd" (an organisation). Google's health/education-adjacent ranking favours named authors. Add a short author bio (you, plus musical background) with `Person` schema, and link articles from an `/about` page.

### ★ More game modes = more keywords (M–L)
- **Interval mode** (name the interval): targets "interval ear training game".
- **Chord mode** (major/minor/dim): targets "chord ear training".
- **Wider range or hard mode** (C3–C6).

Each mode gets its own landing page and daily.

### ★ Embeddable widget (M)
`<iframe src="https://pitchd.net/embed">` for music-teacher blogs and course sites, with a "Powered by pitchd." backlink. Cheap backlinks from relevant domains.

### ★ Colour-blind friendly grid (S)
Green/yellow/red is hard to read with deuteranopia. Add a high-contrast palette toggle (Wordle does) and apply it to the result dots, share emoji and OG card.

### ★ Smaller polish
- **Mid-game quit**: there's no way to abandon a round except reloading.
- **Entry animations are no-ops.** The `animate-in fade-in zoom-in-95` classes come from `tw-animate-css`, which isn't installed. Install it, or delete the classes.
- **gsap** is used only for the piano bounce, score count-up and particle parallax. Swapping to CSS/WAAPI would cut about 25 KB gz.
- **Streak freeze** (one missed day per week forgiven) to reduce churn after a missed day.
- **Show the player's own rank** on the leaderboard, even when outside the top 10.
- **Stats baseline**: `/api/stats` adds +1000/+500 to the global counters. Once real numbers pass these, drop the offset so the "games played worldwide" figure is real.
- **API rate limiting**: the write endpoints are unauthenticated. Vercel Firewall rate rules or Upstash Ratelimit (about 10 lines) would stop counter-inflation spam.
- **Localization**: Spanish and Portuguese ear-training searches are large and less competitive. The game UI has very little text, so translating the articles is the main cost.

---

## How to measure whether any of this worked

| Metric | Source | Why |
|---|---|---|
| Share rate = `share` / `game_complete` | Vercel events | Health of the viral loop; target > 10% for daily |
| `/share` → `game_start` conversion | Vercel (referrer `/share`) | Is the challenge page converting? |
| Day-1 / day-7 return | `game_start` by returning device | Retention from the daily mechanics |
| Organic clicks to `/articles/*`, `/bpm/articles/*` | Google Search Console | SEO fixes; titles and links take 2–6 weeks to reflect |
| LCP / INP on mobile | Vercel Speed Insights | Bundle cut |

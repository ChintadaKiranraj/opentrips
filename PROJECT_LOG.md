# OpenTrips — Project Log

Running notes on the hackathon, the research that shaped the idea, every
technical decision, every bug and how it got fixed, and current status.
Written so Kiran (or future-me) can pick this up cold.

---

## 1. The hackathon

**Hacktoberfest Open-Source AI Challenge Week 1: "Touch Grass"**
`dev.to/challenges/hacktoberfest-week1-2026-10-05`

- **Prompt:** build something with open-source AI at its core (open-weight model, open-source agent harness/framework, or local inference) and explain why open mattered.
- **Theme:** get people off the screen and into the world. Hiking, gardening, birding, run clubs, fall foliage all count.
- **Dates:** contest start Oct 5, 2026, 9:00 AM PDT. **Submissions due Oct 11, 2026, 11:59 PM PDT = Oct 12, 2026, 12:29 PM IST.**
- **Judging** (writing quality weighted most heavily): Writing Quality, Relevance to Prompt/Theme, Creativity, Technical Execution, Use of Partner Technology (optional). Ties broken by post reactions.
- **Rules that bind us:** one entry per contest period, repo must be newly created within the entry window (this repo was), one prize max per participant, submission = DEV post using the template + a demo + code + "why open matters."
- **Submission template sections:** What I Built, Demo, Code, How I Built It, Why Does Open Innovation Matter?, My Agent Session (optional), Prize Categories.
- **Targeting:** Best Use of Tinker ($200), Best Use of TabPFN ($200), Best Use of Render ($200). All three because we have real credits/accounts for them, and real evidence to show for each, not just token usage.

---

## 2. Competitive research (what's already been submitted)

Read in depth before picking the idea, so we knew what we were up against:

| Post | What it is | Where it's weak |
|---|---|---|
| **FrostWise** (sarvar_04) | TabPFN-v2 + Gemma3-1b, offline frost-date planting advisor | Synthetic training data (20 US cities), no accuracy validation vs real frost records, one anecdote as evidence |
| **FieldIssue** (himanshu_748) | Huge multi-sponsor stack (11 categories), photo-revisit comparison | Tinker fine-tune tied its own base model (17/18 vs 17/18, "a signal, not a benchmark" per the author). TabPFN scored *worse* than a majority-class guess (16/24 vs 17/24) |
| **PLOT** (pranjal_manhgaye) | TabPFN + Open-Meteo + Render, "wait/walk/garden" verdict. 55 reactions, the engagement leader | US-12-cities only. Labels are the author's own hand-written rules, so the model mostly reproduces them (circular). **No baseline reported at all.** Uses the hosted TabPFN API while claiming "open" |
| **DeskBreak** (amanmaurya92) | Sentry-traced screen-break app | Claims local-only, but ships `sendDefaultPii: true` to Sentry. Offline claim asserted, not demonstrated |
| **WildLens** (keerthisree25) | Plant/nature photo ID companion | "Complete data privacy" claim breaks the moment the Hugging Face provider is used (needs internet) |

**What this means for us:** report real baselines (nobody else reliably did), use real recorded events not self-authored rules, and don't claim anything the architecture doesn't actually do.

---

## 3. The idea: OpenTrips

"Should I go out this weekend?" for anywhere in the world. Describe a trip
(place, dates, ability, constraints, budget) in plain language, get a
rain/landslide risk verdict backed by real historical data, plus a
day-by-day plan and packing list from a model fine-tuned specifically for
this task.

Originally scoped as a monsoon-trek planner for India only, then widened
to global after confirming the data supports it (see §5) and after seeing
PLOT's US-only scope as a weakness worth not repeating.

---

## 4. Team split

Two independent services on two separate Render accounts (both teammates
have their own Render/Backboard/Tinker subscriptions + hackathon promo
credits, so no shared rate limits).

- **Ashwin (Track A):** data pipeline, TabPFN risk model, Tinker plan model, FastAPI backend, his own Render deploy, domain.
- **Kiran (Track B):** Next.js frontend, Postgres (saved plans), request/results UI, offline-cached plan page, his own Render deploy.

**Shared contract** (so neither side blocks the other, Kiran can build against mocked responses matching this shape):

```
POST /risk   { lat, lon, start_date, end_date }
  → { risk: 0..1, verdict: "go"|"caution"|"wait", rain_mm_forecast, model_accuracy }

POST /plan   { request_text, lat, lon, start_date, end_date, risk }
  → { days: [...], packing: [...], warnings: [...], checks_passed: true|false }
```

---

## 5. Data: NASA Global Landslide Catalog + Open-Meteo

- Source: `data.nasa.gov` Global Landslide Catalog export (one-time export, current as of March 2016, compiled since 2007 at NASA Goddard).
- Raw file: 11,033 events across 142 countries, all-time.
- Filtered to `location_accuracy` ≤ 10km, then sampled to 1,746 positive events for runtime reasons (786 from India kept in full, 960 sampled from the rest of the world).
- Each event paired with real rainfall history from **Open-Meteo's archive API** (free, no key): 1-day, 3-day, 7-day, 14-day precipitation sums ending on the event date.
- Negative (non-event) examples: randomly sampled lat/lon/date globally, same rainfall-feature pipeline. Plus **496 additional India-located negatives**, added specifically to fix the GEO split (see bug #1 below).
- Final `landslide_dataset.csv`: 3,935 rows, committed to the repo so the training data is independently verifiable (not a claim judges have to take on faith).

---

## 6. TabPFN: results and the two bugs that made the first numbers meaningless

Provider: Prior Labs (`priorlabs.ai`), via the `tabpfn-client` package, `TABPFN_TOKEN` from account settings.

### Bug #1: GEO split was testing nothing
First run: majority baseline 0.000, AUC `nan`. Root cause: negative rows
never got a `country` tag, so filtering `country == "India"` for the
held-out test pulled in only real positive events, zero negatives. TabPFN's
93% there was just "predicted positive most of the time," not
generalization. **Fix:** generated 496 India-located negative examples
(`add_india_negatives.py`) so the test set actually has both classes.

### Bug #2: TIME split was badly imbalanced
Majority baseline 0.166 on a plain chronological split, meaning the test
slice was overwhelmingly one class, because positive and negative rows
were sampled over different date ranges. **Fix:** stratified the split by
label (last 20% of each class by date, concatenated), not a global sort.

### Final, trustworthy results

| Split | Majority | Logistic Regression | **TabPFN** |
|---|---|---|---|
| TIME (stratified) | 0.556 | 0.799 | **0.914** acc / 0.972 AUC |
| GEO (India held out entirely from training) | 0.390 | 0.821 | **0.899** acc / 0.956 AUC |

The GEO number is the headline claim: trained on **zero** India data, 90%
accurate and 0.956 AUC telling real India landslide events apart from
sampled non-events. Beats both TabPFN competitors above, one reported no
baseline, the other's TabPFN lost to its own majority guess.

---

## 7. Tinker: results and three real SDK surprises

Provider: Thinking Machines, base model `Qwen/Qwen3-8B`, LoRA rank 16.

The documented API pattern (used successfully on an earlier project) did
**not** match what the installed SDK actually expects. Found by
introspecting the installed package directly rather than guessing twice:

- `types.Datum(model_input=..., ...)`, not `input=...`.
- `loss_fn_inputs` values must be `tinker.TensorData(data=[...], dtype="float32" | "int64")`, explicit dtype required, not raw Python lists.
- `create_lora_training_client_async` / `create_sampling_client_async` needed, calling the sync versions from inside an async function triggers a real deadlock-risk warning.
- `save_weights_for_sampler_async` resolves to *another* awaitable future, needs a second `await` to get the real checkpoint object.
- `sample_async` requires an explicit `num_samples` argument.
- `SampleResponse` has **no `.text` attribute**. The generated output is only available as raw token IDs at `result.sequences[0].tokens`, must be decoded with the tokenizer.

### Training data
24 hand-written prompt → JSON-plan examples (`plan_examples.jsonl`),
deliberately spread across India, US, UK, Switzerland, Nepal, Japan, Peru,
New Zealand, Kenya, France, Iceland, South Africa, with varied ability,
constraints (bad knee, asthma, elderly parent, toddler, fear of heights,
pregnancy, etc.), budgets, and currencies, this is what backs the "works
globally" claim for the plan model specifically.

### Undertraining, then a missing stop token
First training run did a single `forward_backward` + `optim_step` over all
24 examples, one gradient step total. Result: the model barely changed,
it defaulted to Qwen3's normal chain-of-thought reasoning prose (even
hallucinating an unrelated photography question) instead of JSON.
**Fixed** with a real 20-epoch loop (shuffle, forward_backward, optim_step,
per epoch, in `train_plan_model.py`).

After that fix, the model produced **correct, well-formed, contextually
relevant JSON** but never learned to stop, it just repeated the same
answer until hitting the token limit. **Fixed** without retraining again:
`prompt_format.extract_first_json()` does balanced-brace matching to pull
out just the first complete JSON object from the repeated stream.

Also added `prompt_format.wrap_prompt()`, a single shared instruction
prefix used identically at training and inference time, so there's never
a train/inference mismatch.

### Final eval (`compare_plans.py`, 10 held-out requests never seen in training)

| | Pass rate |
|---|---|
| Base model | **0 / 10** |
| Fine-tuned | **8 / 10** |

Checkpoint: `tinker://4deeaa51-09a3-5d86-8281-29ad275d2c0c:train:0/sampler_weights/opentrips-plan-v1`

This is the "clear improvement over a baseline" the Tinker category
explicitly asks for, and it's a real, honest number from held-out data,
not a tie like FieldIssue's.

---

## 8. Backend (`main.py`)

FastAPI service exposing `/risk` (TabPFN + Open-Meteo forecast),
`/plan` (Tinker fine-tuned checkpoint), `/healthz`. All three tested live,
locally, end to end, see example calls below.

```bash
curl -X POST http://127.0.0.1:8000/risk -d '{"lat":18.52,"lon":73.86,"start_date":"2026-10-11","end_date":"2026-10-12"}'
# → {"risk":0.035,"verdict":"go","rain_mm_forecast":0.0,"model_accuracy":0.899}

curl -X POST http://127.0.0.1:8000/plan -d '{"request_text":"beginner, no constraints, 1 day, from Pune, budget 2000 rupees, wants hills", ...}'
# → {"days":[{"day":1,"activity":"Lonavala hillside walk, short and gentle","distance_km":5}], "packing":[...], "warnings":[...], "budget_estimate":1200, "checks_passed":true}
```

---

## 9. Deployment

`render.yaml` Blueprint prepared for the backend. Env vars required:
`TABPFN_TOKEN`, `TINKER_API_KEY`, `PLAN_CHECKPOINT_PATH` (now set, see §7),
`MODEL_ACCURACY=0.899` (the GEO-split number, our headline claim).

Kiran deploys the Next.js frontend separately, on his own Render account.

---

## 10. Things investigated and ruled out

- **Strava API:** free tier exists in principle (Single Player Mode,
  instant signup, no review needed up to 10 connected athletes), but
  direct attempt to register hit "available to subscribers, start your
  subscription," a real, current paywall. Not usable as planned.
- **Google Fit REST API:** dead end entirely, closed to new app
  registrations since May 2024, being shut down in 2026, no alternative
  per Google's own migration FAQ.
- **Open alternative identified:** GPX file upload. Open XML format, not
  owned by any platform, every fitness app (including Strava, free tier)
  can export a `.gpx` with zero API key or OAuth. Parse with `gpxpy`.
  Not built yet, optional stretch for Kiran if there's slack (~20-30 min),
  otherwise goes in the "what's next" section of the write-up instead of
  being half-built code.

---

## 11. Preferences and standing policies

### GitHub and attribution

- **No AI-tool attribution anywhere, full stop.** No `Co-Authored-By` trailers, no "Generated with [tool]" lines in commits, PRs, code comments, or docs. Commit **author and committer** both verified as Ashwin Temkar on every commit, not just the author field.
- No mention of any AI tool by name anywhere in the repo, code, or write-up, checked by grepping the full tracked tree plus every commit message before each push.
- If GitHub's own UI (contributor graph, Insights) shows something stale after a history rewrite, that's a caching lag on GitHub's side, not a real data problem, confirmed by checking `gh api repos/.../contributors` directly rather than trusting the cached graph.
- All commits are squeaky-clean, real author identity, real descriptive messages, no filler.

### Git identity policy (easy to get backwards, bit us twice already)

- **Global default** (`git config --global`): `ashwin@haddowsinfotech.com`, the work default, applies to projects under `Documents/haddows`.
- **Local override**, set explicitly at the start of every personal/hackathon project: `ashwintemkar@gmail.com`. Must be `git config --local user.email ...` run *after* `git init`, not before (deleting `.git` also deletes a local override that was set first).

### Writing style (write-ups, emails, any prose deliverable)

- **No em dashes.** No semicolons either. Use periods, commas, or just rephrase.
- Direct and factual over flowery. State a finding plainly rather than building drama around it.
- When reporting on other people (e.g. the Mergetober organizer email), stick to facts with evidence links, flag uncertainty explicitly rather than asserting bad faith, and don't pad a list with names that don't have solid backing just to make it look more thorough.

### How work gets done

- **Real numbers over presentable numbers.** When the first TabPFN/Tinker results looked plausible but were actually methodology bugs (imbalanced splits, undertrained model), the fix was to find and report the real problem, not to quietly keep the better-looking wrong number.
- Verify library/API behavior by introspecting the actually-installed package when it's load-bearing, rather than trusting documentation or a pattern that worked on a different project.
- Flag anything that risks looking fabricated, gamed, or deceptive (cron-scheduling comments to fake organic timing, inflating claims the architecture doesn't support) before building it, not after.
- Manual/credential tasks (account signups, API tokens, DNS, anything needing a login) get listed out explicitly and separately from what can be built directly, so nothing stalls waiting on an assumption.

---

## 12. Kiran's PR #1 (merged) and the contract mismatch found (A6)

PR #1, `ChintadaKiranraj:feat/nextjs-trip-planner` → `main`, merged
2026-10-10. Came in as a **cross-repo PR from his own fork**, not as a
collaborator push, so the "need his GitHub username to add him as a
collaborator" blocker from §12 (old) never actually had to be resolved,
forking + PR works fine without collaborator access. His username is
`ChintadaKiranraj`, noted here in case collaborator access is still wanted
later for something else (e.g. Render transfer, project boards).

**What's actually in the PR (covers B1 + most of B2, plus extra not in
the original plan):**
- Next.js 15 App Router scaffold, TypeScript strict, Tailwind v4, pnpm.
- `/api/risk` and `/api/plan` Route Handlers, mock-mode by default
  (`USE_MOCK_AI=true`), proxy-mode ready (`USE_MOCK_AI=false` +
  `AI_API_BASE_URL`) but **not yet pointed at anything real**.
- Trip form (destination, dates, free-text constraints) → results page
  (verdict badge, risk gauge, itinerary cards, packing list, budget) via
  `sessionStorage` hand-off.
- **Google sign-in added, not in the original B-track plan.** Every page
  and API route gated behind Auth.js + Google OAuth (`src/proxy.ts`
  matcher). Needs `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` to
  even run locally. Worth asking Kiran why, this adds a signup/credential
  dependency neither of us listed as needed for a judge to try the app.

**The contract problem (this is the real finding, and it's a blocker for
B6, not yet a crisis since nothing's wired to real data yet):**

Kiran's provisional types (`frontend/src/types/risk.ts`,
`frontend/src/types/plan.ts`, explicitly marked "PROVISIONAL CONTRACT,
not yet confirmed" in his own comments) do not match what `main.py`
actually implements:

| | Kiran's frontend expects | `main.py` actually returns/accepts |
|---|---|---|
| `/risk` request | `{ place, latitude, longitude, startDate, endDate, constraints? }` | `{ lat, lon, start_date, end_date }` — no `place`, no `constraints` |
| `/risk` verdict casing | `"GO" \| "CAUTION" \| "WAIT"` | `"go" \| "caution" \| "wait"` |
| `/risk` response shape | nested `rainfallFeatures` object, `modelMetrics` object, `destination`, `explanation`, `modelName` | flat `{ risk, verdict, rain_mm_forecast, model_accuracy }` |
| `/plan` request | `{ place, startDate, endDate, constraints?, riskVerdict?, riskScore? }` — no lat/lon at all | `{ request_text, lat, lon, start_date, end_date, risk }` — requires lat/lon and a single combined `request_text`, not separate `place` + `constraints` |
| `/plan` response shape | `{ destination, startDate, endDate, itinerary: DayPlan[], packingChecklist, safetyNotes, budgetEstimate: {...} }` (camelCase, nested) | whatever JSON the Tinker model emits, originally `{ days, packing, warnings, budget_estimate, checks_passed }` (snake_case, flatter) |

Also: Kiran's form sends `{ latitude: 0, longitude: 0 }` as a placeholder
(no geocoding yet, his own README flags this under "Known limitations"),
but the real `/risk` and `/plan` both require real lat/lon to do anything
meaningful. **Geocoding has to land before real-mode wiring makes sense,
not just type reconciliation.**

**Fix needs to happen on both sides, decide which:**
1. Change `main.py` to match Kiran's richer response shape (more judge-
   friendly presentation, keeps his UI code as-is), or
2. Change Kiran's types/mocks to match `main.py`'s actual flat contract
   (less work, but his mocks and UI currently assume the richer shape),
   or
3. Add a thin adapter in `frontend/src/lib/api/client.ts`'s
   `proxyToBackend` that translates `main.py`'s real shape into Kiran's
   existing types (keeps both sides' code untouched, one function to
   write and test).

Leaning toward (3), smallest surface area, no retroactive changes to
either person's already-working code, this is what A6 ("review Kiran's
PRs, keep the contract honest") was for. Not yet implemented, pending a
decision before Sunday's B5 (swap mocks for real API).

---

## 13. Current status

**Done:**
- A1 data pipeline, A2 TabPFN (gated, cleared), A3 Tinker (gated, cleared), A4 FastAPI service (tested live).
- Repo clean, public, correctly attributed: `github.com/ashwintemkar/opentrips`.
- B1 scaffold + mock APIs, B2 form/results screen (merged, PR #1). Google sign-in added (extra, not originally planned).

**Resolved (no longer blocking):**
- Kiran's GitHub username, `ChintadaKiranraj`. Turned out not to matter either way, he contributed via a fork PR rather than needing collaborator access.

**Needs a decision, then ~30-60 min of work:**
- **Contract mismatch between `main.py` and Kiran's frontend types** (see §12). Must be resolved before B5/B6. Recommend an adapter in `client.ts` over changing either side's working code.

**Not started:**
- A5 (point domain at the deployed Render backend) — can't do until Kiran gives a status or domain is confirmed ready.
- A6 (ongoing — review Kiran's PRs as they land). First pass done, see §12.
- B2 remainder: real geocoding (place name → lat/lon), currently a hardcoded `{0,0}` placeholder, blocks real-mode `/risk` and `/plan` from doing anything meaningful even after the contract is fixed.
- B3: Postgres + persistence for generated plans (currently `sessionStorage` only, nothing survives a refresh or a shared link).
- B4: shareable saved-plan URLs at `/plans/[id]` (route exists as a placeholder, doesn't load anything yet).
- B5: offline caching / service worker for previously generated plans.
- B6: swap Kiran's mocks for the real `main.py` API, once the contract (§12) and geocoding (B2) are both sorted.
- Kiran's own Render deploy of the Next.js app.
- Outdoor test (bonus points, Sunday).
- DEV post write-up, demo video, submission (Sunday night / Monday morning, before Oct 12 12:29 PM IST).

**Open, unresolved side-quest:**
- A separate **TabPFN-3.5 Hackathon** (Prior Labs' own event, NVIDIA hardware prizes) — user wants to cross-submit the same project. Research in progress when work paused: need the actual submission deadline, whether `tabpfn-client`'s `TabPFNClassifier` is really calling TabPFN-3.5 specifically (not an older version, licensing differs between versions), and whether the full hackathon terms have any exclusivity clause. Not yet resolved either way.

---

## 14. Contract fix, geocoding, persistence, and offline caching (A6/B2/B3/B4/B5)

Closed out everything from §12/§13 that didn't need an account or a
credential. **Build verified clean**: `pnpm build` and `pnpm exec tsc
--noEmit` both pass with zero errors on the real Next.js 16 app (not a
guess, actually run).

### The contract fix: went with the adapter (option 3), but honestly

`frontend/src/lib/api/client.ts` now has a real `fetchRealRisk` /
`fetchRealPlan` path that calls `main.py` and translates its shape into
Kiran's existing UI types. But the originally-planned "just map the
fields" approach would have required **fabricating** data the backend
doesn't produce (soil saturation index, per-activity duration/difficulty,
a stay/food/transport budget breakdown), exactly the kind of invented
claim §11's "flag anything that risks looking fabricated" rule exists to
catch. Fixed by changing the shape instead of the adapter:

- `types/risk.ts`: `RainfallFeatures` is now `{rain1dMm, rain3dMm,
  rain7dMm, rain14dMm}`, real rolling windows, the literal features
  TabPFN is scored on. `main.py`'s `/risk` now returns `rain_1d/3d/7d/14d`
  too (it already computed them internally, just never returned them).
  `modelMetrics.accuracy` is the real GEO-split number; precision/recall/
  f1 stay `null`, not invented.
- `types/plan.ts`: dropped the fictional nested `DayPlan`/`OutdoorActivity`
  /budget-breakdown shape. `PlanResponse.days` is now `{day, date,
  activity, distanceKm}[]`, matching exactly what the Tinker model was
  trained to emit (see `plan_examples.jsonl`). `date` is derived
  (`startDate + day - 1`), not model output, commented as such.
- `checksPassed` is now **real**. `main.py`'s `/plan` was hardcoding
  `checks_passed: true` and had a comment saying "rule_checker can be
  wired in here", it wasn't. Now it is: `extract_check_limits()` pulls a
  budget and a per-day distance ceiling out of the free-text request (same
  heuristic style as `rule_checker.py` itself, a rule checking the model,
  not a model), and `check_plan()` actually runs before the response goes
  out.
- `ItineraryCard.tsx` and `RiskSummaryCard.tsx` rewritten to match, a new
  constraints-check badge (pass/fail, from the real `checksPassed`) is
  visible on every generated plan now, not just in `compare_plans.py`'s
  offline eval.
- Mocks (`mock-risk.ts`, `mock-plan.ts`) updated to the same shape, so
  mock and real mode are pixel-identical in structure, only labeled
  differently via `isMockData`.

### Geocoding (B2), closed without a new credential

`frontend/src/lib/geo/geocode.ts` + `/api/geocode` use **Open-Meteo's free
geocoding API**, no key, same open provider already used for weather.
`TripPlannerForm` now resolves the destination before calling `/api/risk`
and `/api/plan`, replacing the hardcoded `{0,0}` placeholder. If a place
can't be resolved, the form shows an inline error instead of silently
sending wrong coordinates.

### Persistence (B3/B4): Prisma schema written, needs a Supabase connection string to actually run

`frontend/prisma/schema.prisma` defines one `Trip` model (place, lat/lon,
dates, constraints, full `riskJson`/`planJson`). `POST /api/trips` saves
a generated trip; `/plans/[id]` is now a real server component that loads
it back. **Degrades gracefully**: if `DATABASE_URL` isn't set, saving
fails with a handled 503 and the form falls back to the old
`sessionStorage` + `/results` flow, so the rest of the app was never
blocked waiting on a database. `@prisma/client` + `prisma` added to
`package.json`, `postinstall` runs `prisma generate` automatically.

**Needs `pnpm approve-builds` or an explicit `allowBuilds` entry** in
`pnpm-workspace.yaml` (added: `@prisma/client`, `@prisma/engines`,
`prisma` all `true`), pnpm now blocks postinstall scripts by default.

### Offline caching (B5), the honest version of the "works with no signal" claim

`frontend/public/sw.js` is a minimal hand-written service worker
(no `next-pwa` dependency, avoided due to Next 16 compatibility risk),
network-first with cache fallback, scoped only to `/plans/*` pages and
their `_next` static assets. Registered client-side via
`ServiceWorkerRegister.tsx` in the root layout. This means: open a saved
plan once while online, it's cached; reopen it later with no connection
and it still loads. That's the real, demonstrable version of "no signal
on the trail", not an asserted one (see §2's competitive research on
posts that asserted offline/private claims their architecture didn't
support).

### Manual/credential tasks, not something I can do from here

Per §11's policy (manual/credential tasks listed separately so nothing
stalls on an assumption):

1. **Supabase Postgres** — create a project, Settings → Database →
   Connection string → URI, use the pooled "Transaction" mode connection
   (port 6543) for serverless Route Handlers, append
   `?pgbouncer=true&connection_limit=1`. Put it in `frontend/.env.local`
   as `DATABASE_URL`, then run `pnpm db:push` once from `frontend/` to
   create the `Trip` table. Same value goes into Kiran's Render env vars
   for the deployed frontend.
2. **Google OAuth** (already in `frontend/README.md`, user is doing this
   themselves) — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
3. **Render env vars for the frontend service**: `AUTH_SECRET`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`,
   `USE_MOCK_AI=false`, `AI_API_BASE_URL=<Ashwin's deployed backend URL>`.
4. **A5, domain DNS** — still blocked on Kiran's Render deploy existing
   first, nothing changed here.
5. Hacktoberfest promo credits (`hacktoberfest.com/my/promos`) for
   Tinker/Render/Backboard if not already claimed, no code work, just
   account action.

### Still not done (at time of §14)

- Backboard was discussed as an optional stretch category, not
  implemented. Given the remaining time to the deadline, recommend
  skipping it rather than half-building a fourth integration.
- Kiran's own Render deploy of the Next.js app.
- Outdoor test (bonus), DEV post, demo video, submission.

---

## 15. Deploy prep: Docker Postgres, Render Blueprint, secrets checklist

Continued from §14. Decision on process: **skip lint-as-a-gate**, catch
problems at `pnpm build` / deploy time instead. Build re-confirmed clean
after the §14 work (`pnpm build` exits 0, all routes listed including
`/api/geocode`, `/api/trips`, `/plans/[id]`).

### What landed in this pass

- **`docker-compose.yml`**: local Postgres 16 for smoke tests without
  waiting on a Supabase project. Connection string
  `postgresql://opentrips:opentrips@localhost:5432/opentrips`. Docker CLI
  is installed on this machine, but **Docker Desktop was not running**
  when we tried `docker compose up -d` (pipe to Linux engine missing).
  Start Docker Desktop, then run that command.
- **`SECRETS_CHECKLIST.md`**: every account/key Ashwin or Kiran has to
  create, Google OAuth, Supabase vs Docker Postgres, TabPFN, Tinker,
  Render frontend/backend env vars, and the order that unblocks deploy.
  Backboard listed as optional after deploy, not claimed until wired.
- **`render.yaml` expanded**: adds `opentrips-web` (Next.js under
  `frontend/`) next to `opentrips-api`. Frontend build uses corepack +
  pnpm, runs `pnpm db:push` only when `DATABASE_URL` is set so a first
  deploy without Supabase still builds. `MODEL_ACCURACY` defaulted to
  `0.899` on the API service.
- Root `.gitignore` now excludes `server.log`, `.cursor/`, `.env.local`.

### Backboard decision (locked for now)

**Do not wire Backboard before Render + real API + demo are live.** Prize
category is real, but half a memory layer is worse than three clean
sponsor stories (Tinker, TabPFN, Render) with numbers. If Slack remains
after deploy, add `BACKBOARD_API_KEY` and a thin "remember my constraints"
call, then claim the category. If not, do not mention Backboard in the
DEV post.

### What you (Ashwin) do next, in order

1. Start Docker Desktop → `docker compose up -d` →
   `cd frontend` → set `DATABASE_URL` → `pnpm db:push` (local save path).
2. Or create Supabase and paste the pooled URI into `DATABASE_URL` (needed
   for Render either way).
3. Paste Google OAuth + `AUTH_SECRET` into `frontend/.env.local`.
4. Deploy FastAPI on Render (`opentrips-api`) with TabPFN/Tinker secrets.
5. Deploy frontend on Render (`opentrips-web`) with auth + `DATABASE_URL` +
   `AI_API_BASE_URL` + `USE_MOCK_AI=false` + `AUTH_URL`.
6. Outdoor test / DEV post / demo before Oct 12, 12:29 PM IST.

---

## 16. Local stack brought up end to end (2026-10-10 evening)

### What we did in this session

- Started **Docker Desktop** (was installed but not running), then
  `docker compose up -d`. Postgres healthy on `localhost:5432`.
- First `pnpm db:push` hit a local schema conflict (`P2002` on PG types).
  Fixed by `DROP SCHEMA public CASCADE` inside the Docker DB (local only,
  not production), then a normal `pnpm db:push`. Trip table is live.
- Created `frontend/.env.local` with `AUTH_SECRET`, local `DATABASE_URL`,
  and later flipped `USE_MOCK_AI=false` pointing at `http://127.0.0.1:8000`.
- **Cleaned `frontend/.env`**: it had been a mistaken copy of root backend
  secrets (TabPFN/Tinker/Backboard). Now it only holds Prisma's
  `DATABASE_URL`. Backend secrets stay in repo-root `.env` only.
- FastAPI started locally: `/healthz` →
  `{"status":"ok","model_accuracy":0.899,"checkpoint_loaded":true}`.
  Direct `/risk` for Pune returned verdict `go` with real rain windows.
- Auth: if Google OAuth env vars are missing, the gate is open so local
  smoke tests work. Production still needs Google IDs set.
- **Mock-mode smoke test** through Next.js: geocode → risk → plan →
  `POST /api/trips` saved id `cmv2njrh800001af4v0etr4bf`.
- **Real-mode smoke test** through Next.js proxy (`USE_MOCK_AI=false`):
  TabPFN risk for Pune ≈ 0.035 / GO / accuracy 0.899, Tinker plan returned
  a valid day+packing+warnings with `checksPassed: true`, `isMockData: false`.

### Currently running locally

- Docker Postgres (`opentrips-postgres`)
- FastAPI on `127.0.0.1:8000`
- Next.js dev on `127.0.0.1:3000` (real AI mode)

### Still needs a human

1. Google OAuth client ID/secret into `frontend/.env.local` (and Render)
   for production sign-in.
2. Supabase pooled `DATABASE_URL` for Render (local Docker is fine for
   demo on this machine only).
3. Deploy both services on Render via `render.yaml` + paste secrets from
   `SECRETS_CHECKLIST.md`.
4. Backboard keys already exist in root `.env`, still not wired in code.
   Optional after deploy.

---

## 17. Kiran PR #2 merged (maps + insights)

PR #2 (`feat/addedMaps`) was still **OPEN** when we checked; Ashwin
believed it was already merged. Merged via `gh pr merge 2`, then
`git pull --ff-only`. Adds:

- Leaflet destination map on `/results`
- `POST /api/geocode` via OpenStreetMap Nominatim (replaces our earlier
  Open-Meteo geocode helper)
- `POST /api/insights`: NASA landslides nearby, Open-Meteo weather grid,
  OSM stays ranked by stars / distance / landslide proximity

Local Track A work was stashed, PR pulled, stash reapplied. Conflicts
resolved in `TripPlannerForm.tsx` (Kiran's Nominatim POST + stages, plus
our `/api/trips` save), `frontend/README.md`, and `pnpm-lock.yaml`
(leaflet + prisma deps reinstalled). `pnpm build` clean afterward.

---

## 18. Go-live status (2026-10-12 morning)

Full deploy + test + sponsor note is in `DEPLOY_AND_TEST.md`.
Public domain target: `opentrips.ashwintemkar.com`.

**Ready to go live on code. Not live yet.** Contest deadline is
**today 12:29 PM IST**. Claim only Tinker, TabPFN, Render. Do not
claim Backboard. Next human actions: push this working tree, Supabase
URI, Google prod OAuth, Render both services, CNAME, DEV post.

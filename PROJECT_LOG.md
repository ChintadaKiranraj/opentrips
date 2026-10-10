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

## 12. Current status

**Done:**
- A1 data pipeline, A2 TabPFN (gated, cleared), A3 Tinker (gated, cleared), A4 FastAPI service (tested live).
- Repo clean, public, correctly attributed: `github.com/ashwintemkar/opentrips`.

**Blocking:**
- **Kiran's GitHub username** — needed to add him as a collaborator, nothing else blocks on this but his own repo access does.

**Not started:**
- A5 (point domain at the deployed Render backend) — can't do until Kiran gives a status or domain is confirmed ready.
- A6 (ongoing — review Kiran's PRs as they land).
- All of Track B (Next.js frontend, Postgres, UI, offline page, his Render deploy).
- Outdoor test (bonus points, Sunday).
- DEV post write-up, demo video, submission (Sunday night / Monday morning, before Oct 12 12:29 PM IST).

**Open, unresolved side-quest:**
- A separate **TabPFN-3.5 Hackathon** (Prior Labs' own event, NVIDIA hardware prizes) — user wants to cross-submit the same project. Research in progress when work paused: need the actual submission deadline, whether `tabpfn-client`'s `TabPFNClassifier` is really calling TabPFN-3.5 specifically (not an older version, licensing differs between versions), and whether the full hackathon terms have any exclusivity clause. Not yet resolved either way.

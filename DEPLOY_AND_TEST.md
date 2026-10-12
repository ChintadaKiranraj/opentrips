# OpenTrips: go-live, providers, sponsors, deploy, test

Deadline: **Oct 12, 2026, 12:29 PM IST**. Public site: **https://opentrips.ashwintemkar.com**

---

## Are we ready to go live?

**Code: yes, locally proven. Public live: not yet.**

Proven on this machine:

- FastAPI `/healthz` ok, checkpoint loaded, `model_accuracy=0.899`
- Real `/risk` for Pune: GO, risk ~0.035, real rain windows
- Real `/plan` via frontend proxy: valid JSON, `checksPassed: true`, `isMockData: false`
- Geocode, insights map, Postgres save (`/api/trips` → `/plans/[id]`)
- `pnpm build` clean after Kiran PR #2

Still blocking a public URL:

1. Local Track A work is **not pushed** (adapter, Prisma, SW, auth bypass, `render.yaml` frontend service).
2. Neither Render service is confirmed live with secrets.
3. Google OAuth not set for production (local gate is open when keys are empty. Do not ship that).
4. Production Postgres should be **Supabase**, not Docker.
5. DNS for `opentrips.ashwintemkar.com` not pointed yet.
6. DEV post + demo still to write.

Do not wait for Backboard. Keys exist. Code does not. Do not claim it.

---

## Providers to get things from (accounts / keys)

| Need | Provider | Cost / key | Where it goes | Status |
|---|---|---|---|---|
| Host API + web | **Render** | hackathon credits / free | dashboard env vars | Blueprint in `render.yaml`. You paste secrets. |
| Landslide model | **Prior Labs (TabPFN)** | `TABPFN_TOKEN` | Render `opentrips-api` | Already in root `.env` |
| Plan model | **Thinking Machines (Tinker)** | `TINKER_API_KEY` + checkpoint | Render `opentrips-api` | Already in root `.env` |
| Login | **Google Cloud OAuth** | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Render `opentrips-web` + Google console | You create. Add prod URLs. |
| Session secret | you generate | `AUTH_SECRET` (`npx auth secret`) | Render `opentrips-web` | Generated locally already |
| Prod Postgres | **Supabase** | `DATABASE_URL` pooled port **6543** + `?pgbouncer=true&connection_limit=1` | Render `opentrips-web` | You create |
| Domain | your DNS for `ashwintemkar.com` | CNAME `opentrips` → Render frontend | registrar | You do this (A5) |
| Weather / rain features | **Open-Meteo** | none | called at runtime | ready |
| Place search + map tiles + stays | **OpenStreetMap / Nominatim** | none (User-Agent required, already set) | frontend routes | ready (Kiran PR #2) |
| Training events | **NASA Global Landslide Catalog** | none | `landslide_dataset.csv` in repo | ready |

Optional, **do not block deploy**:

| Need | Provider | Status |
|---|---|---|
| Memory / RAG prize | Backboard | Keys in root `.env`. **Not wired. Do not claim.** |
| Local DB only | Docker Postgres | Already running for smoke tests |

---

## Sponsors we can honestly enter

One project can list every category it **actually uses**. One prize max per person. Writing quality is weighted most.

### Claim these three

**1. Best Use of Tinker ($200)**

- What: LoRA fine-tune of open-weight `Qwen/Qwen3-8B` on 24 outdoor-plan examples.
- Requirement met: clear improvement over a baseline.
- Number: held-out `compare_plans.py` **8/10 vs base 0/10**.
- Innovation vs field: FieldIssue tied 17/18 vs 17/18. Ours is a real gap. Rule checker is live on `/plan` (`checks_passed`), not a hardcoded true.
- Evidence: checkpoint `tinker://4deeaa51-09a3-5d86-8281-29ad275d2c0c:train:0/sampler_weights/opentrips-plan-v1`, `train_plan_model.py`, `compare_plans.py`.

**2. Best Use of TabPFN ($200)**

- What: classify landslide vs non-event from real NASA rows + Open-Meteo rainfall features.
- Requirement met: forecast/classify from a CSV, used as the `/risk` tool.
- Number: GEO split (India held out of training) **0.899 acc / 0.956 AUC**. TIME split 0.914 / 0.972. Beats majority and logistic regression.
- Innovation vs field: PLOT used self-authored labels and reported no baseline. FieldIssue lost to majority-class. We report both baselines and a held-out country.
- Evidence: `landslide_dataset.csv`, `train_tabpfn.py`, UI shows `model_accuracy=0.899`.

**3. Best Use of Render ($200)**

- What: AI runtime (FastAPI + TabPFN + Tinker) and the Next.js front end, two web services in `render.yaml`.
- Requirement met: host the agent's front end and the model runtime.
- Innovation: two accounts possible so rate limits do not collide. Health check `/healthz`. Domain `opentrips.ashwintemkar.com` on the web service.

### Do not list these

Backboard (unused), Gemma, Arduino UNO Q, DigitalOcean, ElevenLabs, Entire, Copilot, Mastra, MongoDB Atlas, Sentry, SerpApi, Temporal, Tiger Data.

Supabase and Google are **infrastructure**, not prize categories.

---

## Deploy steps (do in this order)

### 0. Clock

If it is after ~11:40 IST, skip polish. Push, deploy API, deploy web, write the DEV post with a localhost demo video if DNS is late. Submission is the DEV post + repo + demo, not a pretty domain.

### 1. Push the uncommitted work

Working tree still has the contract adapter, Prisma, SW, auth, `render.yaml` frontend, `docker-compose.yml`, this file. Commit and push to `main` (you asked for this later, or say go). Render Blueprint reads GitHub `main`.

Do **not** commit `.env`, `.env.local`, `server.log`.

### 2. Supabase (5 min)

1. New project.
2. Settings → Database → URI → **Transaction pooler, port 6543**.
3. Append `?pgbouncer=true&connection_limit=1`.
4. From `frontend/`: `DATABASE_URL=... pnpm db:push` once so the `Trip` table exists.

### 3. Google OAuth for production (5 min)

Console → Credentials → OAuth Web client.

Origins:

- `http://localhost:3000`
- `https://opentrips-web.onrender.com` (update after Render gives the real hostname)
- `https://opentrips.ashwintemkar.com`

Redirects:

- `http://localhost:3000/api/auth/callback/google`
- `https://opentrips-web.onrender.com/api/auth/callback/google`
- `https://opentrips.ashwintemkar.com/api/auth/callback/google`

### 4. Render: API first

New Blueprint from this repo, or create Web Service from `main`.

Service `opentrips-api`:

| Env | Value |
|---|---|
| `TABPFN_TOKEN` | from root `.env` |
| `TINKER_API_KEY` | from root `.env` |
| `PLAN_CHECKPOINT_PATH` | `tinker://4deeaa51-09a3-5d86-8281-29ad275d2c0c:train:0/sampler_weights/opentrips-plan-v1` |
| `MODEL_ACCURACY` | `0.899` |

Wait until `https://<api>.onrender.com/healthz` returns `checkpoint_loaded: true`. First boot trains/fits TabPFN. Can take a few minutes.

### 5. Render: frontend

Service `opentrips-web`, root dir `frontend`.

| Env | Value |
|---|---|
| `USE_MOCK_AI` | `false` |
| `AI_API_BASE_URL` | `https://<api>.onrender.com` (no trailing slash) |
| `DATABASE_URL` | Supabase pooled URI |
| `AUTH_SECRET` | same as local or a new `npx auth secret` |
| `AUTH_GOOGLE_ID` | from Google |
| `AUTH_GOOGLE_SECRET` | from Google |
| `AUTH_URL` | first `https://opentrips-web.onrender.com`, then `https://opentrips.ashwintemkar.com` after DNS |

### 6. Domain

At your DNS:

```
CNAME  opentrips  →  <opentrips-web.onrender.com>
```

In Render → `opentrips-web` → Custom Domain → `opentrips.ashwintemkar.com`.

Then set `AUTH_URL=https://opentrips.ashwintemkar.com` and add the Google origin/redirect. Wait for TLS.

### 7. Submit (the actual contest entry)

DEV post using the Week 1 template, tags `#devchallenge` `#hf26challenge`.

Required sections: What I Built, Demo (live URL or video), Code (repo), How I Built It, Why Open Innovation Matters, Prize Categories.

Prize line to paste:

> Best Use of Tinker, Best Use of TabPFN, Best Use of Render.

Credit Kiran: list his DEV username in the body. One of you publishes.

---

## Test doc (thorough)

Mark each row. Fail = do not record the demo on that path.

### A. Local (already done once. Re-run if you changed env)

| # | Test | Pass if |
|---|---|---|
| A1 | `GET http://127.0.0.1:8000/healthz` | `status=ok`, `model_accuracy=0.899`, `checkpoint_loaded=true` |
| A2 | `POST /risk` Pune 18.52,73.86, dates this weekend | JSON with `risk`, `verdict` go/caution/wait, `rain_1d/3d/7d/14d`, `model_accuracy` |
| A3 | `POST /plan` beginner, bad knee, budget 3000 | `days`, `packing`, `warnings`, `checks_passed` boolean (not always true) |
| A4 | Frontend `USE_MOCK_AI=false` → `/api/risk` | `isMockData=false`, accuracy 0.899 |
| A5 | Frontend `/api/plan` | `isMockData=false`, `checksPassed` present |
| A6 | `POST /api/geocode` `{place:"Munnar, Kerala"}` | lat/lon + displayName |
| A7 | `POST /api/insights` those coords + dates | layers landslides / weather / stays, each ok or error, never a blank 500 for one failure |
| A8 | `POST /api/trips` then open `/plans/{id}` | same risk + plan persist |
| A9 | Kill network, reopen a previously visited `/plans/{id}` | service worker cache (B5). Honest offline = cached plan, not live inference |
| A10 | Empty Google keys locally | app usable. **Must not** be true on the public URL |

### B. Render API

| # | Test | Pass if |
|---|---|---|
| B1 | `/healthz` | same as A1 |
| B2 | `/risk` Pune | same shape as A2, not a 502 from TabPFN token |
| B3 | `/plan` beginner bad knee | JSON, not `PLAN_CHECKPOINT_PATH not set` |
| B4 | `/risk` with garbage body | 422, no stack dump |

### C. Render web / domain

| # | Test | Pass if |
|---|---|---|
| C1 | Open `https://opentrips.ashwintemkar.com` (or onrender URL) | loads, not the local-open-auth leak if Google is set |
| C2 | Sign in with Google | lands on form |
| C3 | Sign out / incognito `/api/risk` | 401 if Google configured |
| C4 | Form: Munnar, 2 days, "beginner, bad knee, budget 3000" | geocode works, verdict + accuracy visible, itinerary + packing, map + insights |
| C5 | Result URL is `/plans/{id}` | refresh still shows the plan |
| C6 | Share that URL in another browser | loads (if not behind auth, or after sign-in) |
| C7 | WAIT / high-rain destination if you can find one | verdict WAIT or CAUTION, copy does not say "go camping anyway" |
| C8 | Impossible place name | inline error, no `{0,0}` request |
| C9 | API down test: break `AI_API_BASE_URL` | 502/503, no mock data silently |
| C10 | Mobile width | form + map usable |
| C11 | Dark mode | map tiles + cards readable |
| C12 | Footer / OSM attribution | "© OpenStreetMap contributors" visible on the map |

### D. Honesty / contest (judges will check this)

| # | Test | Pass if |
|---|---|---|
| D1 | Mock badge gone in real mode | no "Simulated data" on a live plan |
| D2 | Accuracy shown is 0.899, not invented precision/recall | those stay n/a |
| D3 | Plan is outdoor (walk/trail/camp), not hotels as the product | stays layer is context, itinerary is outdoor |
| D4 | DEV post does not say "offline inference" or "private" | offline = cached saved plan |
| D5 | DEV post does not list Backboard / Gemma / etc. | only Tinker, TabPFN, Render |
| D6 | Repo is public, created in the contest window | `github.com/ashwintemkar/opentrips` |
| D7 | No AI-tool attribution in commits or the post | grep before push |

### Suggested demo script (90 seconds)

1. Type Munnar, dates, "beginner, bad knee, budget 3000".
2. Show GO/CAUTION/WAIT + 0.899 accuracy.
3. Show map: landslides, weather, stays.
4. Show day list, packing, `checks passed`.
5. Refresh `/plans/{id}`.
6. Optional: airplane mode, reopen that URL.

---

## Prize paragraph (paste into the DEV post)

OpenTrips uses three partner tools for three different jobs, each with a number.

**Tinker:** Qwen3-8B fine-tuned to emit a JSON outdoor plan from messy constraints. Held-out pass rate 8/10 vs 0/10 for the base model. A rule checker scores budget and distance. That is the improvement Tinker asked for.

**TabPFN:** trained on real NASA landslide events plus Open-Meteo rainfall, not hand-written labels. Trained with India held out, 89.9% accuracy / 0.956 AUC on India. Beats majority and logistic regression. The UI shows that accuracy on every verdict.

**Render:** hosts the FastAPI model runtime and the Next.js app. Live risk and plan come from that runtime, not from a mock.

Open mattered because we could fine-tune an open-weight model, train TabPFN on a public CSV we commit to the repo, and pull weather and maps without a paid API key.

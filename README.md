# OpenTrips

"Should I go out this weekend?" for anywhere in the world. You describe a trip in plain language (place, dates, ability, constraints, budget), and OpenTrips returns a rain/landslide risk verdict backed by real historical data, plus a day-by-day plan and packing list written by a model fine-tuned on that kind of request.

Built for the Hacktoberfest Open-Source AI Challenge Week 1: "Touch Grass."

## Architecture

Two independent services, deployed on two separate Render accounts.

```
                    ┌─────────────────────┐
  User ──────────▶  │  Next.js frontend    │  (Kiran, Render account #2)
                    │  Postgres (saved     │
                    │  plans)               │
                    └──────────┬───────────┘
                               │ POST /risk, POST /plan
                               ▼
                    ┌─────────────────────┐
                    │  FastAPI backend      │  (Ashwin, Render account #1)
                    │  TabPFN (risk model)  │
                    │  Tinker (plan model)  │
                    └─────────────────────┘
```

## API contract

```
POST /risk
  body: { lat, lon, start_date, end_date }
  returns: { risk: 0..1, verdict: "go"|"caution"|"wait", rain_mm_forecast, model_accuracy }

POST /plan
  body: { request_text, lat, lon, start_date, end_date, risk }
  returns: { days: [...], packing: [...], warnings: [...], checks_passed: true|false }
```

Both sides can build against this contract without waiting on each other. Mock the responses on the frontend until `/healthz` on the real backend returns `checkpoint_loaded: true`.

## Secrets and deploy checklist

See [`SECRETS_CHECKLIST.md`](SECRETS_CHECKLIST.md) for every account/key you
need to create (Google OAuth, Supabase or local Docker Postgres, TabPFN,
Tinker, Render). Put values in `frontend/.env.local` and Render env vars.
Do not commit them.

`render.yaml` deploys both the FastAPI backend and the Next.js frontend.

## Frontend setup (Kiran's track)

The Next.js application lives in [`frontend/`](frontend/README.md). From that
directory, run `pnpm install`, copy `.env.example` to `.env.local`, configure
Google sign-in credentials, and run `pnpm dev`.

Optional local Postgres:

```bash
docker compose up -d
cd frontend
# PowerShell
$env:DATABASE_URL="postgresql://opentrips:opentrips@localhost:5432/opentrips"
pnpm db:push
```

Contract adapter, geocoding, Prisma persistence, and offline plan caching are
already in place. Keep `USE_MOCK_AI=true` until the backend `/healthz` is live,
then set `USE_MOCK_AI=false` and `AI_API_BASE_URL` to the Render API URL.

## Backend setup (Ashwin's track)

```bash
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt

# 1. Build the dataset (NASA landslide events + Open-Meteo rainfall history)
.venv\Scripts\python.exe build_dataset.py

# 2. Gate check: does TabPFN beat simple baselines? Paste your Prior Labs token
#    into train_tabpfn.py first.
.venv\Scripts\python.exe train_tabpfn.py

# 3. Fine-tune the plan model on Tinker
.venv\Scripts\python.exe train_plan_model.py

# 4. Compare base vs fine-tuned on held-out requests
.venv\Scripts\python.exe compare_plans.py <checkpoint-path-from-step-3>

# 5. Run the API locally
set PLAN_CHECKPOINT_PATH=<checkpoint-path>
set MODEL_ACCURACY=<geo-split accuracy from step 2>
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

## Why open source AI matters here

- **TabPFN** (Prior Labs) is trained on real NASA landslide records, not hand-written rules, and tested with India held out entirely from training to prove it generalizes globally, not just to one region.
- **Tinker** (Thinking Machines) fine-tunes an open Qwen model on trip-planning examples; `compare_plans.py` reports the pass-rate gap against the un-tuned base model on held-out requests, not just a demo.
- **Render** hosts both the AI runtime (this service) and the user-facing app, on two independent accounts.

## Evidence files

- `landslide_dataset.csv` — the real training data, committed so judges can verify it isn't synthetic.
- `train_tabpfn.py` output — baseline comparison numbers.
- `compare_plans.py` output — base vs fine-tuned pass rates.

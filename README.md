# OpenTrips

Should I go out this weekend?

You name a place, pick dates, and describe yourself in one sentence. OpenTrips returns a rain and landslide risk verdict with the model's measured accuracy, plus a day by day outdoor plan and a packing list. The plan is for walks, hills, and camps. It is not a hotel itinerary.

Built for the Hacktoberfest Open Source AI Challenge, Week 1, Touch Grass.

| | |
| --- | --- |
| Code | https://github.com/ashwintemkar/opentrips |
| Risk model | TabPFN on real NASA landslide events |
| Plan model | Qwen3 8B, fine tuned with Tinker |
| Weather | Open Meteo, no API key |
| Maps | OpenStreetMap |

## What you get

1. A verdict of go, caution, or wait, and the accuracy number 0.899 on the screen.
2. Days, distances, a packing list, and a pass or fail check against your budget and ability.
3. A map of recorded landslides nearby, the forecast grid, and places to stay.
4. A link you can reopen. A plan you already opened still loads if you lose signal.

## The numbers

Training data is the NASA Global Landslide Catalog plus Open Meteo rainfall. `landslide_dataset.csv` has 3,935 rows and is in this repo.

| Split | Majority guess | Logistic regression | TabPFN |
| --- | --- | --- | --- |
| Time, last 20 percent of each class | 0.556 | 0.799 | 0.914 accuracy, 0.972 AUC |
| Geography, India never seen in training | 0.390 | 0.821 | 0.899 accuracy, 0.956 AUC |

The plan model was tested on 10 requests it did not see in training.

| | Passed |
| --- | --- |
| Base Qwen3 8B | 0 of 10 |
| Fine tuned checkpoint | 8 of 10 |

## How it fits together

```mermaid
flowchart LR
    U[You] --> WEB[Next.js app]
    WEB --> GEO[OpenStreetMap]
    WEB --> RISK[Risk API]
    WEB --> PLAN[Plan API]
    RISK --> METEO[Open Meteo]
    RISK --> TAB[TabPFN]
    PLAN --> QWEN[Qwen3 8B on Tinker]
    WEB --> MAP[Landslides, weather, stays]
```

The web app lives in [`frontend/`](frontend/README.md). The model API is [`main.py`](main.py).

```
POST /risk
  { lat, lon, start_date, end_date }
  { risk, verdict, rain windows, model_accuracy }

POST /plan
  { request_text, lat, lon, start_date, end_date, risk }
  { days, packing, warnings, checks_passed }
```

## Why open models

TabPFN is scored on recorded landslide events, not rules we wrote ourselves. India was held out of training. The 0.899 accuracy is that test.

The plan writer is an open weight model, Qwen3 8B, fine tuned for this task. The comparison against the untouched base model is 8 of 10 versus 0 of 10.

Weather and maps use open services with no paid key. Render hosts the API and the website.

A new plan needs the server. What works with no signal is a plan you already opened and saved. We do not claim the phone runs the model on the trail.

## Run it locally

Backend:

```bash
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
set PLAN_CHECKPOINT_PATH=your-tinker-checkpoint
set MODEL_ACCURACY=0.899
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

`GET /healthz` should report `checkpoint_loaded: true` once `TABPFN_TOKEN` and `TINKER_API_KEY` are set. Do not commit those keys.

Frontend, from `frontend/`:

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Set `USE_MOCK_AI=false` and `AI_API_BASE_URL=http://127.0.0.1:8000` to use the real models. Leave mock mode on if you only want the interface.

Optional local database:

```bash
docker compose up -d
```

Then set `DATABASE_URL=postgresql://opentrips:opentrips@localhost:5432/opentrips` and run `pnpm db:push` inside `frontend/`.

Deploy both services with [`render.yaml`](render.yaml). The list of keys to paste is in [`SECRETS_CHECKLIST.md`](SECRETS_CHECKLIST.md).

## Evidence in this repo

| File | What it is |
| --- | --- |
| `landslide_dataset.csv` | Training rows, events and non events |
| `train_tabpfn.py` | Baseline comparison |
| `train_plan_model.py` | Tinker fine tune |
| `compare_plans.py` | Base model versus fine tuned model |
| `plan_examples.jsonl` | Outdoor plan examples used for training |
| `rule_checker.py` | Budget and distance checks used by the live API |

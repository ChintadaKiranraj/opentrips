# Secrets and accounts checklist

You create the accounts and paste the values. Code is already wired for them.
Nothing here should be committed. Put local values in `frontend/.env.local`
and root `.env` for the FastAPI service. Put production values in Render
dashboard env vars (or Blueprint secrets).

---

## 1. Google OAuth (login) — you said you already have Google

**Local note:** if `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are empty, the
app currently allows open access so you can smoke-test without sign-in.
Set both before any public Render URL goes live.

Console: https://console.cloud.google.com/apis/credentials

Create an OAuth client ID, type **Web application**.

Authorized JavaScript origins:

- `http://localhost:3000`
- `https://YOUR-FRONTEND.onrender.com`
- `https://opentrips.ashwintemkar.com`

Authorized redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://YOUR-FRONTEND.onrender.com/api/auth/callback/google`
- `https://opentrips.ashwintemkar.com/api/auth/callback/google`

| Env var | Where |
|---|---|
| `AUTH_GOOGLE_ID` | frontend `.env.local` + Render frontend |
| `AUTH_GOOGLE_SECRET` | frontend `.env.local` + Render frontend |
| `AUTH_SECRET` | generate with `npx auth secret`, same places |
| `AUTH_URL` | production only: `https://YOUR-FRONTEND.onrender.com` |

---

## 2. Postgres — pick one

### Option A: Docker local (fastest smoke test)

```bash
docker compose up -d
cd frontend
# PowerShell:
$env:DATABASE_URL="postgresql://opentrips:opentrips@localhost:5432/opentrips"
pnpm db:push
```

Then in `frontend/.env.local`:

```
DATABASE_URL=postgresql://opentrips:opentrips@localhost:5432/opentrips
```

### Option B: Supabase (use this for Render/production)

1. Create a Supabase project.
2. Project Settings → Database → Connection string → URI.
3. Use the **pooled Transaction** connection (port **6543**).
4. Append `?pgbouncer=true&connection_limit=1`.

| Env var | Where |
|---|---|
| `DATABASE_URL` | frontend `.env.local` + Render frontend |

After setting it locally:

```bash
cd frontend
pnpm db:push
```

---

## 3. FastAPI backend (Ashwin's Render) — already in `render.yaml`

| Env var | Notes |
|---|---|
| `TABPFN_TOKEN` | Prior Labs account |
| `TINKER_API_KEY` | Thinking Machines / Tinker |
| `PLAN_CHECKPOINT_PATH` | `tinker://4deeaa51-09a3-5d86-8281-29ad275d2c0c:train:0/sampler_weights/opentrips-plan-v1` |
| `MODEL_ACCURACY` | `0.899` (GEO-split headline) |

---

## 4. Frontend → real AI (swap mocks off)

| Env var | Value |
|---|---|
| `USE_MOCK_AI` | `false` on Render once backend `/healthz` is live |
| `AI_API_BASE_URL` | `https://YOUR-BACKEND.onrender.com` (no trailing slash) |

Keep `USE_MOCK_AI=true` locally until the backend is reachable.

---

## 5. Backboard (optional, after deploy)

Prize category exists. Not wired yet on purpose: finish Render + Supabase +
demo first, then add memory only if there's slack. If you want it next:

| Env var | Where |
|---|---|
| `BACKBOARD_API_KEY` | frontend or backend, depending on where we attach memory |

Do not claim Backboard in the DEV post until it is actually used in the app.

---

## Order that unblocks everything

1. Google OAuth + `AUTH_SECRET` → app can sign in locally.
2. Docker Postgres **or** Supabase `DATABASE_URL` → `pnpm db:push` → shareable `/plans/[id]`.
3. Deploy FastAPI on Render with TabPFN/Tinker env vars.
4. Deploy frontend on Render with auth + `DATABASE_URL` + `AI_API_BASE_URL` + `USE_MOCK_AI=false`.
5. Point custom domain (A5) if ready.
6. DEV post + demo before Oct 12, 12:29 PM IST.

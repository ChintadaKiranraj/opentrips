# Trip Planner

AI-powered outdoor trip planner and landslide-risk assessment tool, built for Hacktoberfest 2026.

Given a destination, travel dates, and natural-language constraints (e.g. "beginner, bad knee, budget
₹3000"), the app evaluates landslide risk for that place and those dates, shows a GO, CAUTION, or WAIT
verdict with transparent model metrics, and generates a personalized outdoor itinerary and packing list.

**This repository covers Track B: the Next.js frontend, mock APIs, and (in later phases) database
integration and offline support.** The real risk and itinerary models are being built separately as a
Python FastAPI service by another teammate; this app currently talks to local mocks that stand in for
that service.

## Technology stack

- [Next.js](https://nextjs.org) (App Router, React Server Components)
- TypeScript (strict mode)
- Tailwind CSS v4
- pnpm
- ESLint (`eslint-config-next`)

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` will provide the version pinned in `package.json`)

## Installation

```bash
pnpm install
```

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable          | Description                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `USE_MOCK_AI`       | `true` (default) uses local mock responses. `false` proxies to `AI_API_BASE_URL`.               |
| `AI_API_BASE_URL`   | Base URL of the FastAPI AI backend. Required when `USE_MOCK_AI=false`; read server-side only.    |
| `AUTH_SECRET`       | Auth.js session encryption key. Generate one with `npx auth secret`.                           |
| `AUTH_GOOGLE_ID`    | Google OAuth client ID.                                                                        |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret.                                                                   |

These are read exclusively on the server and are never exposed to the client.

## Google sign-in

Every page and API route requires a signed-in Google account (enforced in `src/proxy.ts`). To set up
credentials:

1. Open [Google Cloud Console credentials](https://console.cloud.google.com/apis/credentials) and
   create an **OAuth client ID** of type **Web application**.
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
4. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`, then
   restart `pnpm dev`.

For production, add the deployed origin and its `/api/auth/callback/google` URI in the same place.

## Development commands

```bash
pnpm dev      # start the dev server at http://localhost:3000
pnpm lint     # run ESLint
pnpm build    # production build
pnpm start    # run the production build
```

TypeScript validation: `pnpm exec tsc --noEmit`

## API endpoints

All endpoints are Next.js Route Handlers. The risk and plan endpoints form the frontend-facing API boundary to the AI
service. In mock mode they return deterministic, clearly-labeled mock data generated in `src/lib/api/mock-risk.ts` and
`src/lib/api/mock-plan.ts`. In proxy mode (`USE_MOCK_AI=false`) they forward the request to the
FastAPI backend at `AI_API_BASE_URL` and return its response unchanged.

### `POST /api/risk`

Request:

```json
{
  "place": "Munnar, Kerala",
  "latitude": 10.0889,
  "longitude": 77.0595,
  "startDate": "2026-10-17",
  "endDate": "2026-10-18",
  "constraints": "Beginner, bad knee, budget INR 3000"
}
```

Response (mock mode):

```json
{
  "destination": "Munnar, Kerala",
  "riskScore": 0.42,
  "verdict": "CAUTION",
  "explanation": "Simulated data suggests elevated ground-saturation risk...",
  "rainfallFeatures": {
    "last24hRainfallMm": 12.3,
    "last72hRainfallMm": 58.1,
    "forecastRainfallMm": 20.4,
    "soilSaturationIndex": 0.55
  },
  "modelName": "mock-risk-v0 (placeholder, not a trained model)",
  "modelMetrics": {
    "accuracy": null,
    "precision": null,
    "recall": null,
    "f1Score": null,
    "notes": "No real model metrics are available yet..."
  },
  "isMockData": true,
  "disclaimer": "SIMULATED DATA: this risk score is a mock placeholder..."
}
```

### `POST /api/geocode`

Resolves a destination name to coordinates with OpenStreetMap's
[Nominatim](https://nominatim.org) search (server-side, cached in memory to respect the
[usage policy](https://operations.osmfoundation.org/policies/nominatim/)).

Request: `{ "place": "Munnar, Kerala" }`

Response: `{ "displayName": "...", "latitude": 10.08, "longitude": 77.06, "boundingBox": [s, n, w, e] }`,
or `404` when OpenStreetMap has no match.

The trip form calls this before `/api/risk`, and the results page shows the destination on an
interactive OpenStreetMap map (Leaflet). Map tiles come from `tile.openstreetmap.org` and carry the
required "© OpenStreetMap contributors" attribution.

### `POST /api/insights`

Real (not mocked) area data for the destination map, fetched in parallel. Each layer succeeds or
fails on its own, so one slow source never blanks the whole map.

Request: `{ "latitude": 10.08, "longitude": 77.06, "startDate": "2026-10-17", "endDate": "2026-10-18" }`

Response: `{ "landslides": Layer, "weather": Layer, "stays": Layer }`, where each layer is
`{ "status": "ok", "data": ... }` or `{ "status": "error", "message": "..." }`. See
`src/types/insights.ts` for the full shape.

| Layer | Source | What it shows |
| --- | --- | --- |
| Past landslides | [NASA Global Landslide Catalog](https://data.nasa.gov/Earth-Science/Global-Landslide-Catalog/h9d8-neg4) | Recorded events within 30 km, sized by fatalities |
| Bad weather | [Open-Meteo](https://open-meteo.com) forecast | A 5 by 5 grid around the destination, shaded where heavy rain, storms, or strong wind are forecast for the trip dates |
| Places to stay | OpenStreetMap via Nominatim | Hotels, guest houses, resorts, and hostels within 15 km, ranked by stars, distance, and distance from recorded landslides |

Stays less than 1 km from a recorded landslide are flagged as risky and ranked lower. Open-Meteo
forecasts only 16 days ahead; for later trips the next 7 days are shown with a note. The landslide
catalog is downloaded once per server process and cached in memory.

### `POST /api/plan`

Request: same trip details, plus optional `riskVerdict` and `riskScore` from a prior `/api/risk` call.

Response (mock mode): destination, date range, a day-by-day itinerary (activities, durations,
difficulty), a packing checklist, safety notes, a budget estimate, and an `isMockData: true` flag.
See `src/types/plan.ts` for the full shape.

## Mock mode vs. real API mode

- **Mock mode (`USE_MOCK_AI=true`, default):** `src/lib/api/client.ts` calls the local generators in
  `src/lib/api/mock-risk.ts` and `mock-plan.ts`. Useful for frontend development without the FastAPI
  service running. All mock responses are explicitly labeled (`isMockData: true`, a `disclaimer`
  string, and null model metrics) so they can never be mistaken for real forecasts.
- **Real API mode (`USE_MOCK_AI=false`):** the same client proxies to `AI_API_BASE_URL` + `/risk` or
  `/plan`. If `AI_API_BASE_URL` is missing in this mode, the route returns a `503` configuration error
  instead of silently falling back to mock data.

The request and response types in `src/types/risk.ts` and `src/types/plan.ts` are marked
**provisional**. They describe what Track B currently mocks, not a contract confirmed with the backend developer. They
must be reconciled with the real FastAPI service before go-live.

## Known limitations

- Risk scores and itineraries are simulated demo data only. They are not real landslide forecasts or
  AI-generated plans.
- Geocoding uses the free public Nominatim instance, which allows about one request per second. A
  production deployment should use a self-hosted or commercial geocoder and tile server.
- OpenStreetMap has no guest reviews or prices, so hotel ranking uses stars, distance, and landslide
  proximity only. The NASA landslide catalog covers events reported from 2007 to 2020.
- No persistence: results live only in `sessionStorage` for the current tab (see `/results`). The
  `/plans/[id]` route is a reserved placeholder and does not yet load saved plans.
- No offline support yet.
- No automated tests yet.

## Next development tasks (B3 to B6)

B2 (geocoding the destination with OpenStreetMap) is done.

- **B3:** PostgreSQL and Prisma persistence for generated plans; replace the `/results` sessionStorage
  hand-off with a saved record.
- **B4:** Shareable saved-plan URLs served from `/plans/[id]`.
- **B5:** Offline caching (service worker) for previously generated plans.
- **B6:** Replace `src/lib/api/mock-risk.ts` and `mock-plan.ts` with the real FastAPI integration once
  the backend developer confirms the `/risk` and `/plan` contracts; update `src/types/risk.ts` and
  `src/types/plan.ts` accordingly.
- Loading skeletons and refined mobile layout (currently a basic responsive layout only).

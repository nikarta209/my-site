# KASBOOK Supabase Frontend

This Vite + React application uses Supabase as its primary backend for authentication, database access, and storage. The project includes helper utilities in `src/api/` that wrap the Supabase client and expose entities and higher-level functions used across the UI.

## Environment variables

Environment configuration is driven by GitHub Secrets (CI) and Railway Variables (production).
Define the following secrets in those providers:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (Railway only, used by the Node proxy)
- `COINMARKETCAP_API_KEY` (server worker, optional but recommended)
- `COINGECKO_API_KEY` (optional, used when available as fallback)

During the build step Vite consumes `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` which
are automatically populated from the GitHub/Railway secrets. For local development, copy
`.env.example` to `.env.local` and fill in the same variable names.

Optional variables allow configuring OAuth login, storage buckets, and external webhooks.

Feature flags:

```
NEXT_PUBLIC_FEATURE_SUBSCRIPTION=false
```

Set to `true` to re-enable the Premium subscription banner and related navigation.

## KAS ↔ USD exchange rate service

- The Node worker polls CoinMarketCap every 5 minutes with ±60 seconds jitter and falls back to CoinGecko when necessary.
- Rates are persisted to `public.exchange_rates` with `currency_pair = 'KAS_USD'` using the Supabase service role key.
- All frontend consumers use `GET /api/rate`, which reads from the database and populates it on cold start if needed.
- In-memory caching (60 seconds) ensures burst traffic does not trigger duplicate provider calls.
- Disable the background worker by setting `DISABLE_RATE_WORKER=1` (useful for local development or emergencies).

## Install dependencies

```bash
npm install
```

> If npm registry access is restricted in your environment you may need to install dependencies locally or configure an internal mirror.

## Performance audit CLI dependencies

The optional performance audit tooling under `tools/perf-audit/` relies on `lighthouse` and `chrome-launcher`. These packages are
not part of the default dependency set so they do not block CI environments without browser access. Install them locally before
running the CLI:

```bash
npm install -D lighthouse chrome-launcher
```

The CLI now detects when the packages are missing and will instruct you to install them instead of failing silently.

## Run the development server

```bash
npm run dev
```

## Build for production

```bash
npm run build
```

For questions about the Supabase schema or deployment workflow, review the guides inside the `src/components/setup` directory.

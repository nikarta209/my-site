# KASBOOK Supabase Frontend

This Vite + React application uses Supabase as its primary backend for authentication, database access, and storage. The project includes helper utilities in `src/api/` that wrap the Supabase client and expose entities and higher-level functions used across the UI.

## Environment variables

Create a `.env` file (see `.env.example`) and provide at least:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional variables allow configuring OAuth login, storage buckets, and external webhooks.

If you enable the CoinMarketCap proxy (`/api/coinmarketcap/kas-rate` or `/api/coingecko`),
set `COINMARKETCAP_API_KEY` in the runtime environment for production. Locally you can
define the same secret inside `.env`; the Node server now loads `.env` automatically and
falls back to `VITE_COINMARKETCAP_API_KEY` when `COINMARKETCAP_API_KEY` is not provided.

Feature flags:

```
NEXT_PUBLIC_FEATURE_SUBSCRIPTION=false
```

Set to `true` to re-enable the Premium subscription banner and related navigation.

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

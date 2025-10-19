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

## Run the development server

```bash
npm run dev
```

## Build for production

```bash
npm run build
```

For questions about the Supabase schema or deployment workflow, review the guides inside the `src/components/setup` directory.

## Performance audit tooling

The repository bundles a Lighthouse-based performance harness so audits can run the same way in CI and on local machines.

### One-time setup

1. Install Node dependencies after pulling the latest changes: `npm install`.
2. Install the Chromium build that Playwright and Lighthouse will drive:
   ```bash
   npx playwright install chromium
   ```
   If you are running inside a Linux container you may also need shared library dependencies: `npx playwright install-deps chromium`.
3. Expose a Chrome executable. By default the audit runner relies on the Chromium bundle shipped with Playwright. To use a custom Chrome or Chrome for Testing build, set the `CHROME_PATH` environment variable to the binary you want Lighthouse to launch.

### Network and CPU throttling

The audit harness supports throttling to reproduce lab conditions. You can override the defaults via environment variables when running the command:

| Variable | Description |
| --- | --- |
| `PERF_AUDIT_CPU_SLOWDOWN` | CPU slowdown multiplier passed to Lighthouse (defaults to `4`). |
| `PERF_AUDIT_DOWNLOAD_KBPS` | Simulated download speed in kbps (defaults to `1500`). |
| `PERF_AUDIT_UPLOAD_KBPS` | Simulated upload speed in kbps (defaults to `750`). |
| `PERF_AUDIT_LATENCY_MS` | Round-trip latency in milliseconds (defaults to `40`). |

### Running an audit

Use the dedicated npm script to generate a Lighthouse report, network HAR, and markdown summary:

```bash
npm run perf:audit -- --url https://example.com
```

The script writes artifacts to `tools/perf-audit/artifacts/` by default. You can override the target URL, output directory, and throttling variables described above either through CLI flags that the script accepts or by exporting the environment variables before invoking the command.

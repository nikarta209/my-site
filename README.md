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
The React app now calls the proxy endpoints directly, so the browser never talks to
`pro-api.coinmarketcap.com` and CORS errors are avoided even when the API key is only
available on the server. Optionally set `KAS_LOGO_URL` if you want the proxy to return
a custom Kaspa logo URL alongside the rate data.

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

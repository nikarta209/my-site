# KASBOOK Supabase Frontend

This Vite + React application uses Supabase as its primary backend for authentication, database access, and storage. The project includes helper utilities in `src/api/` that wrap the Supabase client and expose entities and higher-level functions used across the UI.

## Environment variables

Create a `.env` file (see `.env.example`) and provide at least:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional variables allow configuring OAuth login, storage buckets, and external webhooks.

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

## CoinMarketCap proxy configuration

The backend proxy exposes `/api/coinmarketcap/kas-rate` and `/api/coingecko` endpoints.
Provide the CoinMarketCap key through the runtime environment (for example `COINMARKETCAP_API_KEY`)
in production; locally you can define the same secret in `.env`. The server loads `.env` automatically
and falls back to `VITE_COINMARKETCAP_API_KEY` if the non-Vite variable is missing. The React application
always queries the proxy, so the browser never talks to `pro-api.coinmarketcap.com` directly and avoids CORS errors.
Optionally set `KAS_LOGO_URL` to override the logo returned with the rate response.

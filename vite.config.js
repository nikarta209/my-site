import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { getKasRateFromCoinMarketCap } from './server/coinmarketcap.js'

const resolveEnvValue = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key]
    }
  }
  return undefined
}

const createCoinMarketCapProxyPlugin = () => ({
  name: 'kasbook-coinmarketcap-proxy',
  configureServer(server) {
    server.middlewares.use('/api/coinmarketcap/kas-rate', async (req, res, next) => {
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }

      const apiKey = resolveEnvValue('COINMARKETCAP_API_KEY', 'VITE_COINMARKETCAP_API_KEY', 'VITE_CMC_API_KEY')
      if (!apiKey) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: false, error: 'CoinMarketCap API key is not configured' }))
        return
      }

      try {
        const data = await getKasRateFromCoinMarketCap(apiKey)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } catch (error) {
        console.error('[vite coinmarketcap proxy] error', error)
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: false, error: error.message || 'Failed to load Kaspa rate' }))
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createCoinMarketCapProxyPlugin()],
  envPrefix: ['VITE_', 'SUPABASE_'],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'react-helmet-async': fileURLToPath(new URL('./src/components/seo/HelmetShim.js', import.meta.url)),
      'jspdf': fileURLToPath(new URL('./src/shims/jspdf.js', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}) 

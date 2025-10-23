import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_'],
  define: {
    'process.env': {}
  },
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'react-helmet-async': fileURLToPath(new URL('./src/components/seo/HelmetShim.js', import.meta.url)),
      'jspdf': fileURLToPath(new URL('./src/shims/jspdf.js', import.meta.url)),
      'epubjs': fileURLToPath(new URL('./src/shims/epubjs.js', import.meta.url)),
      'pdfjs-dist': fileURLToPath(new URL('./src/shims/pdfjs-dist', import.meta.url)),
      'mammoth/mammoth.browser.js': fileURLToPath(new URL('./src/shims/mammoth.browser.js', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  assetsInclude: ['**/*.epub'],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    exclude: ['pdfjs-dist', 'epubjs', 'mammoth/mammoth.browser.js'],
  },
})

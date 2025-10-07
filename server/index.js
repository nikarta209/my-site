import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fsPromises, createReadStream } from 'node:fs';
import { getKasRateFromCoinMarketCap } from './coinmarketcap.js';

const { stat, access } = fsPromises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveEnvValue = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  return undefined;
};

const COINMARKETCAP_API_KEY = resolveEnvValue(
  'COINMARKETCAP_API_KEY',
  'VITE_COINMARKETCAP_API_KEY',
  'VITE_CMC_API_KEY'
);

const PORT = Number.parseInt(process.env.PORT || '4173', 10);
const DIST_PATH = path.resolve(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.map': 'application/json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.html': 'text/html'
};

const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const serveFile = async (filePath, res) => {
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  try {
    await access(filePath);
    const fileStats = await stat(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileStats.size
    });

    const stream = createReadStream(filePath);
    stream.on('error', (error) => {
      console.error('Error streaming file', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  } catch (error) {
    console.warn('Unable to serve file', filePath, error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
};

const resolveDistPath = (requestPath) => {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  const safePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const absolutePath = path.normalize(path.join(DIST_PATH, safePath));

  if (!absolutePath.startsWith(DIST_PATH)) {
    return path.join(DIST_PATH, 'index.html');
  }

  return absolutePath;
};

const handleKasRateRequest = async (res) => {
  if (!COINMARKETCAP_API_KEY) {
    sendJson(res, 500, { success: false, error: 'CoinMarketCap API key is not configured on the server' });
    return;
  }

  try {
    const data = await getKasRateFromCoinMarketCap(COINMARKETCAP_API_KEY);
    sendJson(res, 200, data);
  } catch (error) {
    console.error('[coinmarketcap] proxy error', error);
    sendJson(res, 502, { success: false, error: error.message || 'Failed to load Kaspa rate' });
  }
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/coinmarketcap/kas-rate')) {
    await handleKasRateRequest(res);
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const targetPath = resolveDistPath(req.url);
  try {
    const stats = await stat(targetPath);
    if (stats.isDirectory()) {
      await serveFile(path.join(targetPath, 'index.html'), res);
      return;
    }
    await serveFile(targetPath, res);
  } catch (error) {
    console.warn('Falling back to SPA index for', req.url, error);
    await serveFile(path.join(DIST_PATH, 'index.html'), res);
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

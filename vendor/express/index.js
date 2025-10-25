import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const getMimeType = (filePath) => MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

const decorateResponse = (res) => {
  if (res._decorated) return res;

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.set = (field, value) => {
    if (typeof field === 'object' && field !== null) {
      Object.entries(field).forEach(([key, val]) => {
        if (val !== undefined) {
          res.setHeader(key, val);
        }
      });
      return res;
    }
    if (field && value !== undefined) {
      res.setHeader(field, value);
    }
    return res;
  };

  res.json = (body) => {
    if (res.headersSent) return res;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body ?? null));
    return res;
  };

  res.send = (body) => {
    if (res.headersSent) return res;
    if (Buffer.isBuffer(body)) {
      res.end(body);
      return res;
    }
    if (typeof body === 'object' && body !== null) {
      return res.json(body);
    }
    if (body === undefined || body === null) {
      res.end();
      return res;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(String(body));
    return res;
  };

  res.sendStatus = (code) => {
    res.statusCode = code;
    res.end(String(code));
    return res;
  };

  res.sendFile = (filePath) => {
    const stream = fs.createReadStream(filePath);
    stream.on('error', (error) => {
      if (res.headersSent) return;
      if (error.code === 'ENOENT') {
        res.statusCode = 404;
      } else {
        res.statusCode = 500;
      }
      res.end();
    });
    res.setHeader('Content-Type', getMimeType(filePath));
    stream.pipe(res);
    return res;
  };

  res._decorated = true;
  return res;
};

const parseUrl = (req) => {
  const rawUrl = req.url || '/';
  const parsed = new URL(rawUrl, 'http://localhost');
  req.path = parsed.pathname || '/';
  req.search = parsed.search || '';
  req.query = Object.fromEntries(parsed.searchParams.entries());
  if (!req.originalUrl) {
    req.originalUrl = rawUrl;
  }
};

const matchRoute = (routePath, requestPath) => {
  if (routePath === '*') return true;
  if (routePath === requestPath) return true;
  if (routePath.endsWith('*')) {
    const base = routePath.slice(0, -1);
    if (requestPath.startsWith(base)) {
      return true;
    }
  }
  return false;
};

const createNext = (stack, index, req, res, done) => {
  let called = false;
  return (err) => {
    if (called) return;
    called = true;
    if (err) {
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.end();
      }
      return;
    }
    runStack(stack, index + 1, req, res, done);
  };
};

const runHandler = (handler, req, res, next) => {
  try {
    const maybePromise = handler(req, res, next);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.catch((error) => {
        if (!res.writableEnded) {
          console.error('[mini-express] handler rejected:', error);
          res.statusCode = 500;
          res.end();
        }
      });
    }
  } catch (error) {
    console.error('[mini-express] handler threw:', error);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.end();
    }
  }
};

const runStack = (stack, index, req, res, done) => {
  if (index >= stack.length) {
    if (done) {
      done();
      return;
    }
    if (!res.writableEnded) {
      res.statusCode = res.statusCode || 404;
      res.end();
    }
    return;
  }

  const layer = stack[index];
  const next = createNext(stack, index, req, res, done);

  if (layer.type === 'middleware') {
    runHandler(layer.handler, req, res, next);
    return;
  }

  if (layer.type === 'route') {
    if (layer.method !== 'ALL' && req.method !== layer.method) {
      runStack(stack, index + 1, req, res, done);
      return;
    }

    if (!matchRoute(layer.path, req.path)) {
      runStack(stack, index + 1, req, res, done);
      return;
    }

    runHandler(layer.handler, req, res, next);
    return;
  }
};

const createApp = () => {
  const stack = [];

  const app = (req, res) => {
    decorateResponse(res);
    parseUrl(req);
    runStack(stack, 0, req, res);
  };

  app.disable = () => app;

  app.use = (handler) => {
    stack.push({ type: 'middleware', handler: handler || (() => {}) });
    return app;
  };

  const register = (method) => (routePath, handler) => {
    stack.push({ type: 'route', method, path: routePath, handler });
    return app;
  };

  app.get = register('GET');
  app.post = register('POST');
  app.patch = register('PATCH');
  app.put = register('PUT');
  app.delete = register('DELETE');
  app.all = register('ALL');

  app.listen = (port, callback) => {
    const server = http.createServer(app);
    return server.listen(port, callback);
  };

  return app;
};

const staticMiddleware = (rootDir) => {
  const resolvedRoot = path.resolve(rootDir);
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    let requestPath = req.path || '/';
    try {
      requestPath = decodeURIComponent(requestPath);
    } catch (error) {
      next();
      return;
    }

    let normalized = path.normalize(requestPath);
    if (normalized.startsWith('..')) {
      next();
      return;
    }

    if (normalized === path.sep) {
      next();
      return;
    }

    const filePath = path.join(resolvedRoot, normalized);
    if (!filePath.startsWith(resolvedRoot)) {
      next();
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        next();
        return;
      }

      res.setHeader('Content-Type', getMimeType(filePath));
      const stream = fs.createReadStream(filePath);
      stream.on('error', (error) => {
        if (!res.writableEnded) {
          if (error.code === 'ENOENT') {
            next();
          } else {
            res.statusCode = 500;
            res.end();
          }
        }
      });
      stream.pipe(res);
    });
  };
};

const jsonMiddleware = () => (req, res, next) => {
  const contentType = (req.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    next();
    return;
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += typeof chunk === 'string' ? chunk : chunk.toString();
  });
  req.on('end', () => {
    if (!raw) {
      req.body = {};
      next();
      return;
    }
    try {
      req.body = JSON.parse(raw);
      next();
    } catch (error) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    }
  });
  req.on('error', (error) => {
    console.error('[mini-express] request error:', error);
    if (!res.writableEnded) {
      res.statusCode = 400;
      res.end();
    }
  });
};

const express = () => createApp();

express.json = jsonMiddleware;
express.static = staticMiddleware;
express.Router = () => createApp();

export default express;

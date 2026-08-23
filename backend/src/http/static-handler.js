import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.pdf', 'application/pdf'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf']
]);

function sendJson(response, statusCode, body, {
  headOnly = false,
  headers = {}
} = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    ...headers,
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
    'Content-Type': 'application/json; charset=utf-8'
  });

  if (headOnly) {
    response.end();
  } else {
    response.end(payload);
  }
}

function sendBadRequest(response, message, headOnly) {
  sendJson(response, 400, { error: message }, { headOnly });
}

function sendNotFound(response, requestUrl, headOnly) {
  sendJson(response, 404, {
    error: 'Not Found',
    path: requestUrl
  }, { headOnly });
}

function sendServerError(response, message, headOnly) {
  sendJson(response, 500, { error: message || 'Internal Server Error' }, { headOnly });
}

function isInsideDirectory(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function createStaticHandler({ root }) {
  const frontendRoot = path.resolve(root);

  return async function staticHandler(request, response) {
    const headOnly = request.method === 'HEAD';
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: 'Method Not Allowed' }, {
        headers: { Allow: 'GET, HEAD' }
      });
      return;
    }

    let requestUrl;
    try {
      requestUrl = new URL(request.url || '/', 'http://localhost');
    } catch {
      sendBadRequest(response, 'Invalid request URL', headOnly);
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      sendBadRequest(response, 'Invalid URL encoding', headOnly);
      return;
    }

    if (pathname.includes('\0') || pathname.includes('\\')) {
      sendBadRequest(response, 'Invalid path', headOnly);
      return;
    }

    if (pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    const relativePath = pathname === '/'
      ? 'index.html'
      : pathname.replace(/^\/+/, '');
    const candidatePath = path.resolve(frontendRoot, relativePath);

    let canonicalRoot;
    let fileStats;
    try {
      [canonicalRoot, fileStats] = await Promise.all([
        realpath(frontendRoot),
        stat(candidatePath)
      ]);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        sendNotFound(response, requestUrl.pathname, headOnly);
      } else {
        sendServerError(response, 'Unable to read static file', headOnly);
      }
      return;
    }

    if (!fileStats.isFile()) {
      sendNotFound(response, requestUrl.pathname, headOnly);
      return;
    }

    let canonicalFile;
    try {
      canonicalFile = await realpath(candidatePath);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        sendNotFound(response, requestUrl.pathname, headOnly);
      } else {
        sendServerError(response, 'Unable to resolve static file', headOnly);
      }
      return;
    }

    if (!isInsideDirectory(canonicalRoot, canonicalFile)) {
      sendNotFound(response, requestUrl.pathname, headOnly);
      return;
    }

    const extension = path.extname(canonicalFile).toLowerCase();
    const contentType = CONTENT_TYPES.get(extension) || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Length': fileStats.size,
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff'
    });

    if (headOnly) {
      response.end();
      return;
    }

    const stream = createReadStream(canonicalFile);
    stream.on('error', (error) => {
      if (!response.headersSent) {
        sendServerError(response, 'Unable to stream static file', false);
      } else {
        response.destroy(error);
      }
    });
    stream.pipe(response);
  };
}

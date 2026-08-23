import { healthHandler } from './health.js';
import { glycanPresetsHandler } from './glycans.js';

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(payload);
}

export function createApiRouter() {
  return function apiRouter(request, response) {
    let requestUrl;
    try {
      requestUrl = new URL(request.url || '/', 'http://localhost');
    } catch {
      sendJson(response, 400, { error: 'Invalid request URL' });
      return;
    }

    if (requestUrl.pathname === '/api/health') {
      if (request.method === 'GET') {
        healthHandler(request, response);
        return;
      }

      response.setHeader('Allow', 'GET');
      sendJson(response, 405, { error: 'Method Not Allowed' });
      return;
    }

    if (requestUrl.pathname === '/api/glycans/presets') {
      if (request.method === 'GET') {
        glycanPresetsHandler(request, response);
        return;
      }

      response.setHeader('Allow', 'GET');
      sendJson(response, 405, { error: 'Method Not Allowed' });
      return;
    }

    if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
      sendJson(response, 404, {
        error: 'Not Found',
        path: requestUrl.pathname
      });
      return;
    }

    sendJson(response, 404, { error: 'Not Found' });
  };
}

export default createApiRouter;

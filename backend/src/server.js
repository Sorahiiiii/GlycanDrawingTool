import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  FRONTEND_ROOT,
  HOST,
  PORT,
  resolveConfig
} from './config.js';
import { createApiRouter } from './api/router.js';
import { createStaticHandler } from './http/static-handler.js';

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  if (!response.headersSent) {
    response.writeHead(statusCode, {
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(payload),
      'Content-Type': 'application/json; charset=utf-8'
    });
  }
  response.end(payload);
}

function normalizeOptions(options = {}) {
  const host = options.host ?? options.HOST ?? HOST;
  const port = options.port ?? options.PORT ?? PORT;
  const frontendRoot = options.frontendRoot
    ?? options.FRONTEND_ROOT
    ?? options.root
    ?? FRONTEND_ROOT;

  if (typeof host !== 'string' || !host) {
    throw new TypeError('HOST must be a non-empty string');
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new TypeError('PORT must be an integer between 0 and 65535');
  }
  if (typeof frontendRoot !== 'string' || !frontendRoot) {
    throw new TypeError('FRONTEND_ROOT must be a non-empty string');
  }

  return {
    HOST: host,
    PORT: port,
    FRONTEND_ROOT: path.resolve(frontendRoot)
  };
}

export function createServer(options = {}) {
  const config = normalizeOptions(options);
  const staticHandler = createStaticHandler({ root: config.FRONTEND_ROOT });
  const apiRouter = createApiRouter();

  const server = createHttpServer(async (request, response) => {
    let requestUrl;
    try {
      requestUrl = new URL(
        request.url || '/',
        `http://${request.headers.host || 'localhost'}`
      );
    } catch {
      sendJson(response, 400, { error: 'Invalid request URL' });
      return;
    }

    try {
      if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
        apiRouter(request, response);
      } else {
        await staticHandler(request, response);
      }
    } catch (error) {
      console.error('[server] Request handling failed:', error);
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Internal Server Error' });
      } else {
        response.destroy(error);
      }
    }
  });

  server.config = config;
  server.frontendRoot = config.FRONTEND_ROOT;
  return server;
}

function listen(server) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(server.config.PORT, server.config.HOST);
  });
}

function installSignalHandlers(server) {
  let closing = false;

  const closeGracefully = (signal) => {
    if (closing) {
      return;
    }
    closing = true;
    console.log(`[server] Received ${signal}; closing`);
    server.close(() => {
      process.exitCode = 0;
    });
  };

  const onSigint = () => closeGracefully('SIGINT');
  const onSigterm = () => closeGracefully('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  server.once('close', () => {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
  });
}

export async function startServer(argv = process.argv.slice(2)) {
  const config = resolveConfig(argv);
  const server = createServer(config);
  await listen(server);

  const address = server.address();
  const displayPort = typeof address === 'object' && address ? address.port : config.PORT;
  console.log(`[server] GlycanDraw server listening on http://${config.HOST}:${displayPort}`);
  console.log(`[server] Frontend root: ${server.frontendRoot}`);
  installSignalHandlers(server);
  return server;
}

const isMainModule = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  startServer().catch((error) => {
    console.error('[server] Failed to start:', error);
    process.exitCode = 1;
  });
}

export default createServer;

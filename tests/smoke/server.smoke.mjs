import assert from 'node:assert/strict';
import { get } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../backend/src/server.js';

const projectRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const server = createServer({
  HOST: '127.0.0.1',
  PORT: 0,
  FRONTEND_ROOT: path.join(projectRoot, 'frontend')
});

function request(pathname) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const requestUrl = `http://127.0.0.1:${address.port}${pathname}`;
    const req = get(requestUrl, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          body,
          headers: response.headers,
          statusCode: response.statusCode
        });
      });
    });
    req.on('error', reject);
  });
}

async function listen() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(server.config.PORT, server.config.HOST, resolve);
  });
}

try {
  await listen();

  const healthResponse = await request('/api/health');
  assert.equal(healthResponse.statusCode, 200);
  assert.match(healthResponse.headers['content-type'], /^application\/json/);
  const health = JSON.parse(healthResponse.body);
  assert.deepEqual(
    {
      status: health.status,
      service: health.service
    },
    {
      status: 'ok',
      service: 'glycan-draw-api'
    }
  );
  assert.equal(typeof health.time, 'string');
  assert.ok(!Number.isNaN(Date.parse(health.time)));

  const presetsResponse = await request('/api/glycans/presets');
  assert.equal(presetsResponse.statusCode, 200);
  assert.match(presetsResponse.headers['content-type'], /^application\/json/);
  const domainData = JSON.parse(presetsResponse.body);
  assert.equal(domainData.presets.glc.shape, 'circle-filled');
  assert.equal(domainData.presets.glc.color, '#0072BC');
  assert.equal(domainData.exportSizes.medium.width, 1000);
  assert.equal(domainData.exportSizes.medium.height, 700);

  const rootResponse = await request('/');
  if (rootResponse.statusCode === 200) {
    assert.match(rootResponse.headers['content-type'], /^text\/html/);
    assert.ok(rootResponse.body.length > 0);
  } else {
    assert.equal(rootResponse.statusCode, 404);
    assert.match(rootResponse.headers['content-type'], /^application\/json/);
    assert.equal(JSON.parse(rootResponse.body).error, 'Not Found');
  }

  console.log('smoke: server and health route verified');
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

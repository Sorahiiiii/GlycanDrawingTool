import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer as createBackendServer } from '../../backend/src/server.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const DEFAULT_APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'frontend'
);
const BROWSER_TIMEOUT_MS = Number(process.env.BROWSER_TIMEOUT_MS || 8000);
const TEXT_CONTENT = 'Glycan E2E';

const APP_ROOT = path.resolve(process.env.APP_ROOT || DEFAULT_APP_ROOT);
const BASE_URL = process.env.BASE_URL || DEFAULT_BASE_URL;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

function getRoutePath(requestUrl, basePath) {
  let routePath;
  try {
    routePath = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  } catch {
    return null;
  }

  if (basePath && basePath !== '/') {
    if (routePath !== basePath && !routePath.startsWith(`${basePath}/`)) {
      return null;
    }
    routePath = routePath.slice(basePath.length) || '/';
  }

  return routePath;
}

function resolveStaticFile(root, routePath) {
  const relativePath = (routePath || '/').replace(/^\/+/, '');
  const absolutePath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  return absolutePath;
}

function createStaticServer(root, basePath) {
  return http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    const routePath = getRoutePath(request.url || '/', basePath);
    if (!routePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    if (routePath === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    fs.stat(resolveStaticFile(root, routePath) || path.join(root, 'missing'), (statError, stat) => {
      let filePath = resolveStaticFile(root, routePath);
      if (!statError && stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (statError || !filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }

      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentType,
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on('error', (error) => {
        response.destroy(error);
      });
      stream.pipe(response);
    });
  });
}

function listen(server, host, requestedPort) {
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
    server.listen(requestedPort, host);
  });
}

async function startServer(root) {
  const requestedUrl = new URL(BASE_URL);
  const scheme = requestedUrl.protocol.replace(':', '');
  if (scheme !== 'http') {
    throw new Error(`Unsupported BASE_URL scheme: ${requestedUrl.protocol}`);
  }

  const host = requestedUrl.hostname === '0.0.0.0' ? '127.0.0.1' : requestedUrl.hostname;
  const requestedPort = requestedUrl.port ? Number(requestedUrl.port) : 4173;
  const basePath = requestedUrl.pathname.replace(/\/+$/, '') || '/';
  const useBackendServer = process.env.USE_BACKEND === '1'
    || path.basename(path.resolve(root)) === 'frontend';
  const server = useBackendServer
    ? createBackendServer({
        FRONTEND_ROOT: root,
        HOST: host,
        PORT: requestedPort
      })
    : createStaticServer(root, basePath);

  let actualPort = requestedPort;
  try {
    await listen(server, host, requestedPort);
    if (actualPort === 0) {
      actualPort = server.address().port;
    }
  } catch (error) {
    if (!['EADDRINUSE', 'EACCES'].includes(error.code)) {
      server.close();
      throw error;
    }

    await listen(server, host, 0);
    actualPort = server.address().port;
  }

  const actualUrl = new URL(requestedUrl.toString());
  actualUrl.hostname = host;
  actualUrl.port = String(actualPort);
  actualUrl.pathname = basePath.endsWith('/') ? basePath : `${basePath}/`;
  actualUrl.search = '';
  actualUrl.hash = '';

  return {
    server,
    url: actualUrl.toString(),
  };
}

function closeServer(server) {
  return new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });
}

function getChromiumExecutable() {
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    if (fs.existsSync(process.env.CHROMIUM_EXECUTABLE_PATH)) {
      return process.env.CHROMIUM_EXECUTABLE_PATH;
    }
    throw new Error(`CHROMIUM_EXECUTABLE_PATH does not exist: ${process.env.CHROMIUM_EXECUTABLE_PATH}`);
  }

  let playwrightExecutablePath;
  try {
    playwrightExecutablePath = chromium.executablePath();
  } catch {
    playwrightExecutablePath = null;
  }

  const candidates = [
    'C:\\Users\\34913\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
    playwrightExecutablePath,
  ];

  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    );
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }

  const executablePath = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!executablePath) {
    throw new Error(
      'No Chromium executable found. Set CHROMIUM_EXECUTABLE_PATH or install Playwright browsers.'
    );
  }

  return executablePath;
}

async function eventually(label, predicate, timeout = BROWSER_TIMEOUT_MS) {
  const deadline = Date.now() + timeout;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 75));
  }

  const suffix = lastError ? ` Last error: ${lastError.message}` : '';
  throw new Error(`Timed out waiting for ${label}.${suffix}`);
}

async function expectCount(page, selector, expected, label = `${selector} count`) {
  await eventually(`${label} to be ${expected}`, async () => {
    const count = await page.locator(selector).count();
    return count === expected ? count : false;
  });
}

async function expectAtLeast(page, selector, minimum, label = `${selector} count`) {
  await eventually(`${label} to be at least ${minimum}`, async () => {
    const count = await page.locator(selector).count();
    return count >= minimum ? count : false;
  });
}

async function expectVisible(page, selector, label = `${selector} visible`) {
  await eventually(label, async () => {
    const locator = page.locator(selector).first();
    return (await locator.count()) > 0 && (await locator.isVisible());
  });
}

async function expectHidden(page, selector, label = `${selector} hidden`) {
  await eventually(label, async () => {
    const locator = page.locator(selector).first();
    return (await locator.count()) > 0 && !(await locator.isVisible());
  });
}

async function expectVisiblePanelTabs(page, expectedTypes, label = `panel tabs ${expectedTypes.join('+')}`) {
  await eventually(label, () =>
    page.evaluate((expected) => {
      const visible = Array.from(document.querySelectorAll('.panel-tab'))
        .filter((tab) => !tab.hidden)
        .map((tab) => tab.dataset.panelTab)
        .sort()
        .join('|');
      return visible === expected.slice().sort().join('|');
    }, expectedTypes)
  );
}

async function expectPanelContentAvailable(page, selector, label = `${selector} content available`) {
  await eventually(label, () =>
    page.evaluate((contentSelector) => {
      const content = document.querySelector(contentSelector);
      return Boolean(content && !content.hidden);
    }, selector)
  );
}

async function expectNoRuntimeErrors(runtimeErrors, label) {
  await new Promise((resolve) => setTimeout(resolve, 30));
  if (runtimeErrors.length > 0) {
    throw new Error(`Runtime errors after ${label}:\n${runtimeErrors.join('\n')}`);
  }
}

async function clickTool(page, tool) {
  await eventually('text editing to settle before tool switch', () =>
    page.evaluate(() => Boolean(window.glycanApp && !window.glycanApp.isEditingText))
  );
  await page.locator(`.tool-btn[data-tool="${tool}"]`).click();
  await eventually(`${tool} tool active`, () =>
    page.evaluate((toolName) => {
      const app = window.glycanApp;
      const button = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
      return app && app.currentTool === toolName && button && button.classList.contains('active');
    }, tool)
  );
}

async function setThemeSwitch(page, checked) {
  await page.locator('#themeSwitch').evaluate((input, next) => {
    input.checked = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, checked);
}

async function workspacePoint(page, xRatio, yRatio) {
  return page.evaluate(({ xRatio: x, yRatio: y }) => {
    const workspace = document.getElementById('workspace');
    if (!workspace) {
      throw new Error('Workspace element not found');
    }
    const bounds = workspace.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width * x,
      y: bounds.top + bounds.height * y,
    };
  }, { xRatio, yRatio });
}

async function readCounts(page) {
  return page.evaluate(() => {
    const app = window.glycanApp;
    const objectList = app ? Array.from(app.objectList.values()) : [];
    return {
      sugars: document.querySelectorAll('#canvas .sugar').length,
      texts: document.querySelectorAll('#canvas .text-element').length,
      connections: document.querySelectorAll('#canvas .connection').length,
      presetGroups: objectList.filter((item) => item.type === 'preset-group').length,
    };
  });
}

async function readSelectedPositions(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('#canvas .sugar.selected')).map((sugar) => ({
      id: sugar.getAttribute('id'),
      x: parseFloat(sugar.getAttribute('data-x')),
      y: parseFloat(sugar.getAttribute('data-y')),
    }))
  );
}

async function readExportSvg(page) {
  return page.evaluate(() => {
    const app = window.glycanApp;
    const exportSize = app.exportSizes[app.currentExportSize];
    const { width, height } = exportSize;
    const canvasCenterX = 2000;
    const canvasCenterY = 1400;
    const defaultMinX = canvasCenterX - width / 2;
    const defaultMinY = canvasCenterY - height / 2;
    const defaultMaxX = canvasCenterX + width / 2;
    const defaultMaxY = canvasCenterY + height / 2;
    const tightBBox = app.computeExportBBox(defaultMinX, defaultMinY, defaultMaxX, defaultMaxY);
    const useMinX = tightBBox ? tightBBox.minX : defaultMinX;
    const useMinY = tightBBox ? tightBBox.minY : defaultMinY;
    const useMaxX = tightBBox ? tightBBox.maxX : defaultMaxX;
    const useMaxY = tightBBox ? tightBBox.maxY : defaultMaxY;
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    app.copyElementsInBounds(exportSvg, useMinX, useMinY, useMaxX, useMaxY);
    return new XMLSerializer().serializeToString(exportSvg);
  });
}

async function runWorkflow(page, runtimeErrors) {
  const initialPoint = await workspacePoint(page, 0.45, 0.5);
  const connectionPoint = await workspacePoint(page, 0.66, 0.38);
  const textPoint = await workspacePoint(page, 0.37, 0.62);
  const presetPoint = await workspacePoint(page, 0.45, 0.7);

  await clickTool(page, 'add');
  await expectVisiblePanelTabs(page, ['sugar', 'linkage'], 'Add Sugar mode panel tabs');
  await expectPanelContentAvailable(page, '#sugarControlsSection', 'Add Sugar mode sugar controls');
  await expectHidden(page, '#rightPanelHint', 'Add Sugar mode hint');
  await page.locator('#sugarControlsSection [data-render-preset="soft"]').evaluate((button) => button.click());
  await eventually('add mode render config', () =>
    page.evaluate(() => window.glycanApp.currentSugarConfig.renderPreset === 'soft')
  );
  await page.mouse.click(initialPoint.x, initialPoint.y);
  await expectCount(page, '#canvas .sugar', 1, 'first sugar');
  await eventually('first sugar uses add-mode render', () =>
    page.evaluate(() => document.querySelector('#canvas .sugar')?.getAttribute('data-render-preset') === 'soft')
  );
  await expectNoRuntimeErrors(runtimeErrors, 'adding the first sugar');
  log('PASS 1/10 - Add Sugar creates one .sugar element');

  const firstSugar = page.locator('#canvas .sugar').first();
  const firstSugarBox = await firstSugar.boundingBox();
  if (!firstSugarBox) {
    throw new Error('Could not locate the first sugar on screen');
  }

  await page.mouse.move(firstSugarBox.x + firstSugarBox.width / 2, firstSugarBox.y + firstSugarBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.move(connectionPoint.x, connectionPoint.y, { steps: 8 });
  await page.waitForTimeout(50);
  await page.mouse.up();
  await expectCount(page, '#canvas .sugar', 2, 'two sugars after connection drag');
  await expectAtLeast(page, '#canvas .connection', 1, 'connection');
  await expectNoRuntimeErrors(runtimeErrors, 'creating the connected sugar');
  log('PASS 2/10 - long-press drag creates a second sugar and one connection');

  await page.evaluate(() => {
    window.glycanApp.currentLinkageConfig.displayMode = 'compact';
  });
  await eventually('compact linkage default', () =>
    page.evaluate(() => window.glycanApp.currentLinkageConfig.displayMode === 'compact')
  );

  await clickTool(page, 'select');
  await firstSugar.click();
  await expectCount(page, '#canvas .sugar.selected', 1, 'selected sugar');
  await expectPanelContentAvailable(page, '#sugarControlsSection', 'sugar controls panel');
  await expectVisiblePanelTabs(page, ['sugar', 'linkage', 'view'], 'sugar selection panel tabs');
  await expectHidden(page, '#viewControlsSection', 'view controls while sugar tab is active');
  await expectAtLeast(page, '#canvas .linkage-arrow', 1, 'linkage arrows for selected sugar');
  await eventually('selected sugar custom color syncs', () =>
    page.evaluate(() => {
      const sugar = document.querySelector('#canvas .sugar.selected');
      const picker = document.getElementById('customSugarColor');
      return sugar && picker && picker.value.toUpperCase() === (sugar.getAttribute('data-color') || '').toUpperCase();
    })
  );
  await expectNoRuntimeErrors(runtimeErrors, 'selecting a sugar');
  log('PASS 3/10 - Select tool selects the sugar and shows the right panel');

  await page.locator('#sugarControlsSection [data-render-preset="soft"]').evaluate((button) => button.click());
  await eventually('selected sugar render preset', () =>
    page.evaluate(() =>
      document.querySelector('#canvas .sugar')?.getAttribute('data-render-preset') === 'soft'
    )
  );
  await expectNoRuntimeErrors(runtimeErrors, 'setting render preset on selected sugar');
  log('PASS NEW - Render buttons set data-render-preset on the selected sugar');

  const exportedSvg = await readExportSvg(page);
  if (exportedSvg.includes('linkage-arrow')) {
    throw new Error('Exported SVG contains a linkage-arrow element');
  }
  await expectNoRuntimeErrors(runtimeErrors, 'building the export SVG');
  log('PASS NEW - Exported SVG excludes .linkage-arrow');

  const connection = page.locator('#canvas .connection').first();
  const connectionBox = await connection.boundingBox();
  if (!connectionBox) {
    throw new Error('Could not locate the connection on screen');
  }
  await page.mouse.click(
    connectionBox.x + connectionBox.width / 2,
    connectionBox.y + connectionBox.height / 2
  );
  await expectCount(page, '#canvas .connection.selected', 1, 'selected connection');
  await expectVisiblePanelTabs(page, ['linkage', 'view'], 'linkage selection panel tabs');
  await expectPanelContentAvailable(page, '#linkageControlsSection', 'linkage controls panel');
  await expectHidden(page, '#sugarControlsSection', 'sugar controls hidden for linkage');
  await expectNoRuntimeErrors(runtimeErrors, 'selecting a linkage');
  log('PASS NEW - Linkage selection shows Linkage plus View tabs');

  await firstSugar.click();
  await page.locator('#canvas .sugar').nth(1).click({ modifiers: ['Shift'] });
  await expectCount(page, '#canvas .sugar.selected', 2, 'two selected sugars for transform');
  await page.evaluate(() => window.glycanApp.activatePanelTab('view'));
  await expectVisible(page, '#viewControlsSection', 'view controls after activating View tab');

  const positionsBeforeTransform = await readSelectedPositions(page);
  await page.locator('#viewControlsSection [data-rotation-step="30"]').click();
  await eventually('rotation updates selected sugar positions', async () => {
    const positions = await readSelectedPositions(page);
    return JSON.stringify(positions) !== JSON.stringify(positionsBeforeTransform);
  });

  await page.locator('#viewControlsSection .panel-group').nth(1).locator('summary').click();
  await page.locator('#viewControlsSection [data-align="left"]').click();
  await eventually('alignment updates selected sugar positions', async () => {
    const positions = await readSelectedPositions(page);
    return positions.length === 2 && Math.abs(positions[0].x - positions[1].x) < 0.001;
  });
  await expectNoRuntimeErrors(runtimeErrors, 'using View rotation and alignment controls');
  log('PASS NEW - View rotation and alignment controls update positions without errors');

  await clickTool(page, 'text');
  await page.mouse.click(textPoint.x, textPoint.y);
  const textInput = page.locator('.text-input-box');
  await expectVisible(page, '.text-input-box', 'text input box');
  await textInput.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(TEXT_CONTENT);
  await page.evaluate(() => {
    const input = document.querySelector('.text-input-box');
    if (!input) {
      throw new Error('Text input disappeared before Enter could be sent');
    }
    // The app's blur listener finishes editing; suppressing the browser blur
    // during the Enter keydown avoids a second removeChild on the same input.
    input.addEventListener('blur', (event) => {
      event.stopImmediatePropagation();
    }, { capture: true, once: true });
    input.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Enter',
      key: 'Enter',
    }));
  });
  await eventually('typed text element', () =>
    page.evaluate((content) =>
      Array.from(document.querySelectorAll('#canvas .text-element')).some((element) => element.textContent === content),
      TEXT_CONTENT
    )
  );
  await expectNoRuntimeErrors(runtimeErrors, 'adding text');
  log(`PASS 4/10 - Add Text creates text "${TEXT_CONTENT}"`);

  await clickTool(page, 'preset');
  const presetThumb = page.locator('.preset-thumb[data-preset-src]').first();
  await expectVisible(page, '#presetGlycanSection', 'preset glycan panel');
  await presetThumb.click();
  await eventually('preset thumbnail activated', () =>
    page.evaluate(() => {
      const app = window.glycanApp;
      const thumb = document.querySelector('.preset-thumb[data-preset-src]');
      return Boolean(app && app.activePreset && thumb && thumb.classList.contains('active'));
    })
  );

  const countsBeforePreset = await readCounts(page);
  await page.mouse.click(presetPoint.x, presetPoint.y);
  await eventually('preset group insertion', () =>
    page.evaluate(({ sugars, connections, presetGroups }) => {
      const app = window.glycanApp;
      const objectList = app ? Array.from(app.objectList.values()) : [];
      const currentGroups = objectList.filter((item) => item.type === 'preset-group' && Array.isArray(item.children)).length;
      return (
        document.querySelectorAll('#canvas .sugar').length > sugars &&
        document.querySelectorAll('#canvas .connection').length > connections &&
        currentGroups > presetGroups
      );
    }, countsBeforePreset)
  );
  await expectNoRuntimeErrors(runtimeErrors, 'inserting a preset group');
  log('PASS 5/10 - Preset mode inserts a preset glycan group');

  const countsAfterPreset = await readCounts(page);
  await page.locator('#undoBtn').click();
  await eventually('preset undo removes inserted elements', async () => {
    const counts = await readCounts(page);
    return (
      counts.sugars < countsAfterPreset.sugars &&
      counts.connections < countsAfterPreset.connections &&
      counts.texts === countsAfterPreset.texts
    );
  });
  const countsAfterUndo = await readCounts(page);

  await page.locator('#redoBtn').click();
  await eventually('preset redo restores inserted elements', async () => {
    const counts = await readCounts(page);
    return counts.sugars === countsAfterPreset.sugars && counts.connections === countsAfterPreset.connections;
  });
  await expectNoRuntimeErrors(runtimeErrors, 'undo and redo');
  log(`PASS 6/10 - Undo removed ${countsAfterPreset.sugars - countsAfterUndo.sugars} sugars; redo restored the counts`);

  await clickTool(page, 'select');
  const textElement = page.locator('#canvas .text-element', { hasText: TEXT_CONTENT }).first();
  await textElement.click();
  await expectCount(page, '#canvas .text-element.selected', 1, 'selected text');
  await expectPanelContentAvailable(page, '#textControlsSection', 'text controls panel');
  await expectVisiblePanelTabs(page, ['text', 'view'], 'text selection panel tabs');
  await expectHidden(page, '#sugarControlsSection', 'sugar controls hidden for text');
  await expectHidden(page, '#linkageControlsSection', 'linkage controls hidden for text');

  const textCountBeforeDelete = (await readCounts(page)).texts;
  await page.keyboard.press('Delete');
  await eventually('text deletion', async () => (await readCounts(page)).texts === textCountBeforeDelete - 1);
  await expectNoRuntimeErrors(runtimeErrors, 'deleting the selected text');
  log('PASS 7/10 - Delete removes the selected text element');

  await page.locator('#clearBtn').click();
  await eventually('clear canvas', async () => {
    const counts = await readCounts(page);
    return counts.sugars === 0 && counts.texts === 0 && counts.connections === 0;
  });
  await expectNoRuntimeErrors(runtimeErrors, 'clearing the canvas');
  log('PASS 8/10 - Clear Canvas removes sugars, texts, and connections');

  const labelBeforeLanguage = await page.locator('#undoBtn').innerText();
  await page.locator('.language-switch .language-link[data-lang="en"]').click();
  await eventually('English toolbar translation', () =>
    page.evaluate(() =>
      window.languageManager &&
      window.languageManager.currentLang === 'en' &&
      document.getElementById('undoBtn').innerText === 'Undo'
    )
  );
  const labelAfterLanguage = await page.locator('#undoBtn').innerText();
  if (labelBeforeLanguage === labelAfterLanguage) {
    throw new Error(`Language label did not change: ${labelBeforeLanguage}`);
  }
  await expectNoRuntimeErrors(runtimeErrors, 'switching language to English');
  log(`PASS 9/10 - Language switch changed toolbar text from "${labelBeforeLanguage}" to "${labelAfterLanguage}"`);
}

async function main() {
  if (!fs.existsSync(path.join(APP_ROOT, 'index.html'))) {
    throw new Error(`APP_ROOT does not contain index.html: ${APP_ROOT}`);
  }

  const { server, url } = await startServer(APP_ROOT);
  log(`Serving ${APP_ROOT} at ${url}`);

  let browser;
  try {
    const executablePath = getChromiumExecutable();
    log(`Launching Chromium from ${executablePath}`);
    browser = await chromium.launch({
      executablePath,
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    const consoleWarnings = [];

    page.on('pageerror', (error) => {
      runtimeErrors.push(`Uncaught page error: ${error.stack || error.message}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(`Console error: ${message.text()}`);
      }
      if (message.type() === 'warning') {
        consoleWarnings.push(message.text());
      }
    });

    await page.goto(`${url}?lang=zh`, { waitUntil: 'domcontentloaded' });
    await expectVisible(page, '#canvas', 'canvas');
    await eventually('glycanApp initialization', () =>
      page.evaluate(() => Boolean(window.glycanApp && window.glycanApp.currentTool === 'select'))
    );
    await eventually('loading cover removal', () =>
      page.evaluate(() => {
        const loadingCover = document.getElementById('loadingCover');
        return !loadingCover || loadingCover.classList.contains('hidden');
      })
    );
    await expectAtLeast(page, '.tool-btn', 5, 'toolbar buttons');
    await expectNoRuntimeErrors(runtimeErrors, 'application initialization');
    log('PASS 10/10 - App initialized: canvas, glycanApp, hidden loader, and toolbar present');

    await expectVisible(page, '#rightPanelHint', 'no-selection panel hint');
    await expectVisiblePanelTabs(page, [], 'no-selection panel tabs');

    await setThemeSwitch(page, true);
    await eventually('night theme applied', () =>
      page.evaluate(() => document.body.dataset.theme === 'night')
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectVisible(page, '#canvas', 'canvas after theme reload');
    await eventually('glycanApp initialization after reload', () =>
      page.evaluate(() => Boolean(window.glycanApp && window.glycanApp.currentTool === 'select'))
    );
    await eventually('loading cover removal after reload', () =>
      page.evaluate(() => {
        const loadingCover = document.getElementById('loadingCover');
        return !loadingCover || loadingCover.classList.contains('hidden');
      })
    );
    await eventually('theme persisted after reload', () =>
      page.evaluate(() => document.body.dataset.theme === 'night')
    );
    await setThemeSwitch(page, false);
    await eventually('day theme restored', () =>
      page.evaluate(() => document.body.dataset.theme === 'day')
    );

    await page.locator('#snapToggle').click();
    await eventually('snap preference enabled', () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('glycan-draw-preferences');
        return raw && JSON.parse(raw).snapEnabled === true;
      })
    );
    await page.locator('#snapToggle').click();
    await eventually('snap preference disabled', () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('glycan-draw-preferences');
        return raw && JSON.parse(raw).snapEnabled === false;
      })
    );

    await runWorkflow(page, runtimeErrors);

    if (consoleWarnings.length > 0) {
      const uniqueWarnings = Array.from(new Set(consoleWarnings));
      log(`Console warnings observed: ${uniqueWarnings.join(' | ')}`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.stack || error.message}`);
  process.exitCode = 1;
});

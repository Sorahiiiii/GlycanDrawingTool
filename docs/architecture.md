# GlycanDraw Architecture

GlycanDraw is split into a small Node.js backend, a browser application, and
shared domain constants. The server and non-browser test infrastructure use
Node.js built-in modules so running the application has no install step.

## Layers

### `backend/api`

The HTTP API boundary. `api/router.js` owns API routing and
`api/health.js` provides the current readiness endpoint:

- `GET /api/health` returns `status`, `service`, and a server timestamp.
- `GET /api/glycans/presets` returns SNFG presets and supported export sizes.
- Unknown `/api/*` routes return JSON 404 responses.

Future glycan persistence, search, or conversion endpoints should be added
behind this router rather than being called directly by the canvas code.

### `frontend/app`

The browser application and its interaction layer. The existing drawing canvas
remains the frontend application layer. Its responsibility is the visual
editor: user input, SVG construction, editing state, export, and undo/redo.
`GlycanDrawer.js` remains the public editor class, while its 13.5k-line legacy
method body is separated into feature mixins under `app/mixins`. Each mixin
owns one slice of the editor: presets, pointer input, shape rendering,
connections, text, export, history, and so on.

`frontend/src/main.js` is the only browser entry point. It creates the
application and injects the shared API client through `glycanApp.api`.

### `frontend/services`

Infrastructure needed by the application:

- `api-client.js` is the only place that performs HTTP API access.
- `language-manager.js` owns locale loading and current-language state.

Services isolate browser concerns and future backend integrations from the
drawing logic. Replacing storage, authentication, networking, or analytics
should not require changing canvas internals.

### `frontend/core`

Framework-independent frontend logic that belongs neither to the HTTP boundary
nor to a specific application screen. This is the intended home for reusable
editor algorithms, validation, serialization, and canvas-independent domain
logic as it is extracted.

The current constants/defaults files keep the frontend runtime independent of
the backend process. `shared/domain` mirrors these small definitions for
backend routes that need the same SNFG data without importing browser code.
The parity unit test keeps the two copies aligned.

### `shared/domain`

Constants and pure domain definitions used by both the frontend and backend.
`snfg-presets.js` contains SNFG monosaccharide presets and
`export-sizes.js` contains the supported export dimensions. These modules have
no browser or Node-specific side effects.

### `frontend/assets` and `frontend/lang`

Static media such as icons, images, and preset glyph templates are served from
`frontend/assets`. Locale JSON files live in `frontend/lang` and are loaded
only through `LanguageManager`.

### `tests`

Node-based integration and regression tests. `tests/smoke` checks that the
server starts and its primary routes work. `tests/e2e` exercises the server,
API client, and application workflow as an end-to-end slice.

## Request Flow

1. `server.js` starts a Node HTTP server and chooses either the API router or
   the static frontend handler.
2. `/api/*` is handled by `api/router.js`.
3. All other paths are resolved only within the configured frontend root.
4. Browser code uses `createApiClient` for every backend request.

The API client is the only allowed frontend-to-backend boundary. Direct
`fetch` calls from app or core modules bypass error handling, timeouts, and
the future service contract.

## Directory Layout

```text
backend/
  src/
    api/
    http/
    config.js
    server.js
frontend/
  index.html
  assets/
  css/
  lang/
  src/
    app/
      GlycanDrawer.js
      mixins/
    core/
    services/
legacy/
  js/
shared/
  domain/
tests/
  e2e/
  smoke/
  unit/
tools/
  split-legacy-drawer.mjs
  split-style-controls.mjs
package.json
```

The server serves `index.html` and static assets from the configured frontend
root. New frontend modules are created under `frontend/src/` so the drawing
application can migrate without changing the HTTP boundary.

## Migration Boundary

The pre-refactor browser application remains available under `legacy/` for
comparison and recovery. The generator scripts in `tools/` reproduce the
mixin split from `legacy/js/script.js`. Root-level frontend duplicates were
removed after their references were migrated to `legacy/`; application changes
belong in `frontend/src/app/`, not in the legacy snapshot.

## Development

Run the separated backend and frontend from the repository root:

```text
npm run dev
```

The application is then available at `http://127.0.0.1:4173`. The Node
backend serves the frontend and exposes `GET /api/health`; browser code calls
that API through `frontend/src/services/api-client.js`.

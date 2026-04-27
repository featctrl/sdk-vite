# @featctrl/vite

[![CI](https://github.com/featctrl/sdk-vite/actions/workflows/ci.yml/badge.svg)](https://github.com/featctrl/sdk-vite/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@featctrl/vite)](https://www.npmjs.com/package/@featctrl/vite)

Vite plugin for [FeatCtrl](https://www.featctrl.com) — feature flag management.

This package wires the [FeatCtrl](https://www.featctrl.com) flag store into the Vite dev server via
`@featctrl/typescript`. It exposes feature flags in two ways:

- **Server-side** — `isFeatureEnabled(key, defaultValue)` for use in SSR loaders (e.g. React Router v7 / Remix).
- **Browser-side** — the `virtual:featctrl/flags` virtual module, which exports a plain `Record<string, boolean>` snapshot of all flags.

> **Important** — the Vite plugin runs in the **Node.js dev server process only**.
> The SDK key is read from environment variables on the server and must **never** be exposed to the browser.

---

## Installation

```bash
npm install @featctrl/vite
```

Peer dependencies:

```bash
npm install @featctrl/typescript vite
```

Requires **Node.js ≥ 22**.

---

## Quick start

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { featCtrl } from '@featctrl/vite';

export default defineConfig({
  plugins: [featCtrl()],
});
```

Environment variables used by the plugin:

| Variable           | Required | Default                    | Description                                                                    |
|--------------------|----------|----------------------------|--------------------------------------------------------------------------------|
| `FEATCTRL_SDK_KEY` | ✅ yes   | —                          | SDK key issued by FeatCtrl                                                     |
| `FEATCTRL_URL`     | no       | `https://sdk.featctrl.com` | Override the FeatCtrl backend URL                                              |
| `FEATCTRL_MODE`    | no       | `livestreaming`            | `livestreaming` (persistent SSE) or `snapshot` (connect once, then disconnect) |

---

## API reference

### `isFeatureEnabled(key, defaultValue)`

Returns the enabled state of a feature flag on the server. If the flag is unknown (store not yet
populated, flag deleted, or key does not exist), returns `defaultValue`.

Use this in SSR loaders — the boolean result is the only flag information that should reach the browser.

```typescript
import { isFeatureEnabled } from '@featctrl/vite';

export async function loader() {
  return {
    showNewDashboard: isFeatureEnabled('new-dashboard', false),
  };
}
```

### `virtual:featctrl/flags`

A Vite virtual module that exports a `flags` object (`Record<string, boolean>`) containing the
current enabled state of all flags. It is invalidated and triggers a full page reload whenever a
flag changes.

```typescript
import { flags } from 'virtual:featctrl/flags';

if (flags['new-dashboard']) {
  // render new dashboard
}
```

---

## Building

```bash
npm run build      # compile TypeScript → dist/
npm run typecheck  # type-check without emitting
```

---

## License

Copyright 2026 Zirnitra SARL. All rights reserved.  
See [LICENSE](./LICENSE) for the full terms.



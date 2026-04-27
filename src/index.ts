import type { Plugin, ViteDevServer } from 'vite';
import { flagStore, sseClient } from '@featctrl/typescript';

// ── Virtual module ────────────────────────────────────────────────────────────

const VIRTUAL_MODULE_ID = 'virtual:featctrl/flags';
const RESOLVED_VIRTUAL_MODULE_ID = '\0virtual:featctrl/flags';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the enabled state of a feature flag.
 *
 * - If the flag exists in the store, returns its current `enabled` value.
 * - If the flag is absent (store not yet populated, flag deleted, or key
 *   does not exist), returns `defaultValue`.
 *
 * Use this in React Router v7 / Remix loaders (server-side only). The boolean
 * result is the only flag information that should reach the browser.
 *
 * @param key          - The feature flag key.
 * @param defaultValue - Fallback value when the flag is unknown.
 *
 * @example
 * ```typescript
 * import { isFeatureEnabled } from '@featctrl/vite';
 *
 * export async function loader() {
 *   return { showNewDashboard: isFeatureEnabled('new-dashboard', false) };
 * }
 * ```
 */
export function isFeatureEnabled(key: string, defaultValue: boolean): boolean {
  return flagStore.isEnabled(key) ?? defaultValue;
}

// ── Vite plugin ───────────────────────────────────────────────────────────────

/**
 * Vite plugin that wires the live FeatCtrl flag store into the Vite dev server.
 *
 * The SSE connection and flag store are managed automatically by
 * `@featctrl/typescript` via environment variables:
 *   - `FEATCTRL_SDK_KEY`  — SDK key for the target environment (required).
 *   - `FEATCTRL_URL`      — Override the default `https://sdk.featctrl.com`.
 *   - `FEATCTRL_MODE`     — `"livestreaming"` (default) or `"snapshot"`.
 *
 * Architecture:
 *   sdk-api ──SSE──► FlagStore (Node.js / @featctrl/typescript)
 *                      ├─ isFeatureEnabled(key, default)  ◄── server-side loaders
 *                      └─ virtual:featctrl/flags           ◄── browser SPA imports
 *                              │ plain Record<string,boolean>
 *                           browser
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { featCtrl } from '@featctrl/vite';
 *
 * export default defineConfig({
 *   plugins: [featCtrl()],
 * });
 * ```
 */
export function featCtrl(): Plugin {
  let devServer: ViteDevServer | null = null;

  function notifyBrowser(): void {
    if (!devServer) return;
    const mod = devServer.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
    if (mod) {
      devServer.moduleGraph.invalidateModule(mod);
    }
    devServer.ws.send({ type: 'full-reload' });
  }

  return {
    name: 'featctrl',

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
      return undefined;
    },

    load(id: string) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return undefined;
      const entries = [...flagStore.getAll().entries()]
        .map(([key, flag]) => `  ${JSON.stringify(key)}: ${flag.enabled}`)
        .join(',\n');
      return `export const flags = {\n${entries}\n};\n`;
    },

    configureServer(server: ViteDevServer) {
      devServer = server;

      if (!sseClient) {
        console.warn(
          '[FeatCtrl] WARNING: sseClient is not running — FEATCTRL_SDK_KEY is not set. ' +
          'All calls to isFeatureEnabled() will return their defaultValue.',
        );
        return;
      }

      sseClient
        .onFlagChanged((flag) => {
          console.log('[FeatCtrl] Flag changed:', flag.key, '→', flag.enabled);
          notifyBrowser();
        })
        .onFlagDeleted((key) => {
          console.log('[FeatCtrl] Flag deleted:', key);
          notifyBrowser();
        });
    },
  };
}


// React-side context store. Single hook owns:
//   1. invoke('load_personal_context') on mount
//   2. listen for the Rust 'context-changed' event (E4-T12)
//   3. parse + Zod-validate via @lifeops/schema
//   4. expose the typed PersonalContext + a load status to consumers
//
// IDEMPOTENCY (W1 risky-corner #7): every tick re-derives state entirely
// from the raw YAML the Rust side hands us. We never merge into prior
// state, never increment counters. If the watcher double-fires the
// answer is the same — same yaml in, same parsed object out.

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { parse } from 'yaml';
import { PersonalContext } from '@lifeops/schema';

export type ContextSource = 'user' | 'demo';

interface LoadedRaw {
  yaml: string;
  source: ContextSource;
}

export type ContextStatus =
  | { kind: 'loading' }
  | { kind: 'ready'; context: PersonalContext; source: ContextSource }
  | { kind: 'error'; message: string };

const CONTEXT_CHANGED = 'context-changed';

function deriveStatus(raw: LoadedRaw): ContextStatus {
  let parsed: unknown;
  try {
    parsed = parse(raw.yaml);
  } catch (err) {
    return { kind: 'error', message: `YAML parse failed: ${describeError(err)}` };
  }
  const result = PersonalContext.safeParse(parsed);
  if (!result.success) {
    return {
      kind: 'error',
      message: `Schema validation failed: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    };
  }
  return { kind: 'ready', context: result.data, source: raw.source };
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Tauri 2 sets globalThis.__TAURI_INTERNALS__ on the WebView side. Useful
 *  to detect a plain `vite preview` browser (no Tauri runtime) so the
 *  context store can fall back to a fetch instead of a Rust invoke. */
function isTauri(): boolean {
  return typeof globalThis !== 'undefined' && '__TAURI_INTERNALS__' in globalThis;
}

async function loadInitial(): Promise<LoadedRaw> {
  if (isTauri()) {
    return invoke<LoadedRaw>('load_personal_context');
  }
  // Browser preview path: serve the demo YAML from Vite's public/ dir
  // so design review + playwright smoke tests work without booting
  // Tauri. Production .app bundles always go through invoke.
  const resp = await fetch('/example-amex-gold.yaml');
  if (!resp.ok) throw new Error(`fetch /example-amex-gold.yaml: ${resp.status}`);
  const yaml = await resp.text();
  return { yaml, source: 'demo' };
}

export function usePersonalContext(): ContextStatus {
  const [status, setStatus] = useState<ContextStatus>({ kind: 'loading' });

  useEffect(() => {
    let mounted = true;
    let unlisten: UnlistenFn | undefined;

    (async () => {
      try {
        const initial = await loadInitial();
        if (mounted) setStatus(deriveStatus(initial));
      } catch (err) {
        if (mounted) setStatus({ kind: 'error', message: `load failed: ${describeError(err)}` });
        return;
      }
      if (!isTauri()) return; // Browser preview: skip the watcher.

      try {
        await invoke('start_context_watcher');
      } catch (err) {
        // Non-fatal: initial load succeeded; we just won't auto-update on
        // disk changes. Surface as console for the dev; no UI banner —
        // the file is read-only at first launch anyway (demo mode).
        // eslint-disable-next-line no-console
        console.warn('start_context_watcher failed:', err);
      }

      unlisten = await listen<LoadedRaw | null>(CONTEXT_CHANGED, async (ev) => {
        if (!mounted) return;
        if (ev.payload && typeof ev.payload === 'object' && 'yaml' in ev.payload) {
          setStatus(deriveStatus(ev.payload));
          return;
        }
        // Watcher signaled "file gone" with empty payload — re-resolve
        // the source path (Rust will fall back to bundled demo).
        try {
          const raw = await invoke<LoadedRaw>('load_personal_context');
          if (mounted) setStatus(deriveStatus(raw));
        } catch (err) {
          if (mounted)
            setStatus({ kind: 'error', message: `reload failed: ${describeError(err)}` });
        }
      });
    })();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  return status;
}

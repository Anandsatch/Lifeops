import chokidar, { type FSWatcher } from "chokidar";

import { atomicRead } from "./atomic-read.js";
import { shouldSuppress } from "./watcher-bus.js";

const DEBOUNCE_MS = 150;

export interface WatchHandle {
  close: () => Promise<void>;
}

/**
 * Watch `path` for external changes and call onChange(contents) on each
 * settled change. Self-writes (atomicWrite from this process) are suppressed
 * via the watcher-bus (see watcher-bus.ts).
 */
export function watchContext(
  path: string,
  onChange: (contents: string) => void,
): WatchHandle {
  let timer: NodeJS.Timeout | undefined;
  let closed = false;

  const watcher: FSWatcher = chokidar.watch(path, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  const fire = () => {
    if (closed) return;
    if (shouldSuppress(path)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (closed) return;
      // Re-check suppression at fire time — atomicWrite marks self-write
      // right before rename; debounce window may overlap.
      if (shouldSuppress(path)) return;
      atomicRead(path).then(
        (raw) => {
          if (!closed) onChange(raw);
        },
        () => {
          // Swallow read errors; caller can handle via separate health checks.
        },
      );
    }, DEBOUNCE_MS);
  };

  watcher.on("add", fire);
  watcher.on("change", fire);
  watcher.on("unlink", () => {
    /* drop — file gone, no payload */
  });

  return {
    async close() {
      closed = true;
      if (timer) clearTimeout(timer);
      await watcher.close();
    },
  };
}

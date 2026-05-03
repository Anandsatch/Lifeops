/**
 * Tiny in-process bus that lets atomicWrite tell every active watcher
 * "I'm about to rename this path — ignore your next event for ~200ms."
 *
 * Kept as its own module so atomicWrite and watchContext share the same
 * Map at runtime without one importing the other.
 */

const SUPPRESS_WINDOW_MS = 200;

const lastSelfWriteAt = new Map<string, number>();

/** Called by atomicWrite right before its rename. */
export function markSelfWrite(path: string): void {
  lastSelfWriteAt.set(path, Date.now());
}

/** Called by the watcher when an event fires. */
export function shouldSuppress(path: string, now = Date.now()): boolean {
  const ts = lastSelfWriteAt.get(path);
  if (ts === undefined) return false;
  if (now - ts <= SUPPRESS_WINDOW_MS) return true;
  // Stale entry — clear so the Map doesn't grow forever.
  lastSelfWriteAt.delete(path);
  return false;
}

/** Test-only reset. */
export function _resetWatcherBus(): void {
  lastSelfWriteAt.clear();
}

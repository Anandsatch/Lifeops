import { promises as fs } from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import lockfile from "proper-lockfile";

import { LockContentionError, WriteError, FsyncError } from "./errors.js";
import { markSelfWrite } from "./watcher-bus.js";

export interface AtomicWriteOptions {
  /** Total time we're willing to spend acquiring the lock. Default: ~700ms across 3 retries. */
  lockTimeoutMs?: number;
}

/**
 * In-process per-path mutex. proper-lockfile is process-aware and rejects
 * a second lock attempt from the same process immediately (ELOCKED), bypassing
 * its own retry policy. So we serialize same-process writes with a small
 * promise chain per path, and let proper-lockfile guard cross-process safety.
 */
const inProcessQueues = new Map<string, Promise<void>>();

async function withInProcessLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = inProcessQueues.get(key) ?? Promise.resolve();
  let resolveNext!: () => void;
  const next = new Promise<void>((r) => (resolveNext = r));
  const chained = prev.then(() => next);
  inProcessQueues.set(key, chained);
  try {
    await prev;
    return await fn();
  } finally {
    resolveNext();
    if (inProcessQueues.get(key) === chained) {
      inProcessQueues.delete(key);
    }
  }
}

/**
 * Atomic write protocol (per E2-T2 spec):
 *   1. Acquire exclusive advisory lock on `path` via proper-lockfile.
 *   2. Write to a tmpfile in the SAME directory (cross-device rename atomicity).
 *   3. fsync the tmpfile fd.
 *   4. Atomic rename to target.
 *   5. fsync the parent directory fd (durable on crash).
 *   6. Release the lock.
 *
 * On lock contention: 3 attempts, exponential backoff 50ms -> 200ms.
 * On any tmpfile failure path: best-effort cleanup of the tmpfile.
 */
export async function atomicWrite(
  targetPath: string,
  contents: string,
  opts: AtomicWriteOptions = {},
): Promise<void> {
  return withInProcessLock(targetPath, () => atomicWriteImpl(targetPath, contents, opts));
}

async function atomicWriteImpl(
  targetPath: string,
  contents: string,
  opts: AtomicWriteOptions,
): Promise<void> {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);

  await fs.mkdir(dir, { recursive: true });

  // Reject symlinks upfront. fs.rename clobbers the symlink itself rather
  // than writing through it, which would silently break the user's intent.
  // Realpath-resolving the symlink before write is a v0.2 design change;
  // for now we surface a clear error.
  try {
    const lst = await fs.lstat(targetPath);
    if (lst.isSymbolicLink()) {
      throw new WriteError(
        targetPath,
        "target is a symlink; symlinks are not supported in v0 (resolve realpath first)",
      );
    }
  } catch (err) {
    if (err instanceof WriteError) throw err;
    if (!isErrnoException(err) || err.code !== "ENOENT") {
      throw new WriteError(targetPath, "lstat failed", err);
    }
    // ENOENT is expected on first-write; fall through.
  }

  let release: (() => Promise<void>) | undefined;
  // Stable lock path regardless of whether the target file exists yet.
  // Always locking the same string closes the dir-vs-file race where two
  // processes acquire different lock namespaces on the boundary of file
  // creation. proper-lockfile creates and manages the .lock directory.
  const lockfilePath = `${targetPath}.lock`;

  try {
    release = await lockfile.lock(targetPath, {
      lockfilePath,
      retries: { retries: 3, minTimeout: 50, maxTimeout: 200, factor: 2 },
      stale: 5_000,
      realpath: false,
    });
  } catch (err) {
    // Only ELOCKED is true contention. EROFS / EACCES / ENOENT-on-parent /
    // EPERM during lock acquisition are filesystem-level write failures and
    // would mislead the caller if surfaced as LockContentionError.
    if (isErrnoException(err) && err.code === "ELOCKED") {
      throw new LockContentionError(targetPath, 3, err);
    }
    throw new WriteError(targetPath, "acquiring lock", err);
  }

  const tmpName = `.${base}.tmp.${process.pid}.${randomBytes(6).toString("hex")}`;
  const tmpPath = path.join(dir, tmpName);
  let tmpHandle: Awaited<ReturnType<typeof fs.open>> | undefined;

  try {
    // Open + write + fsync the tmpfile
    try {
      tmpHandle = await fs.open(tmpPath, "wx", 0o600);
      await tmpHandle.writeFile(contents, { encoding: "utf8" });
    } catch (err) {
      throw new WriteError(targetPath, "writing tmpfile", err);
    }

    try {
      await tmpHandle.sync();
    } catch (err) {
      throw new FsyncError(targetPath, "fsync(tmpfile)", err);
    } finally {
      try {
        await tmpHandle.close();
      } catch {
        /* ignore */
      }
      tmpHandle = undefined;
    }

    // Tell any in-process watchers to ignore the next event for this path.
    markSelfWrite(targetPath);

    try {
      await fs.rename(tmpPath, targetPath);
    } catch (err) {
      throw new WriteError(targetPath, "rename", err);
    }

    // fsync parent dir so the rename is durable across power loss.
    // No-op on Windows; we're macOS/Linux-only.
    let dirHandle: Awaited<ReturnType<typeof fs.open>> | undefined;
    try {
      dirHandle = await fs.open(dir, "r");
      await dirHandle.sync();
    } catch (err) {
      // Some filesystems (like certain network mounts) reject fsync on dirs;
      // we still surface this so callers know durability isn't guaranteed.
      throw new FsyncError(targetPath, "fsync(parent dir)", err);
    } finally {
      if (dirHandle) {
        try {
          await dirHandle.close();
        } catch {
          /* ignore */
        }
      }
    }
  } catch (err) {
    // Best-effort cleanup of the tmpfile if it still exists.
    if (tmpHandle) {
      try {
        await tmpHandle.close();
      } catch {
        /* ignore */
      }
    }
    try {
      await fs.unlink(tmpPath);
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    if (release) {
      try {
        await release();
      } catch {
        /* lock already gone — ignore */
      }
    }
  }

  // Suppress the unused-options warning until we add timeout-aware retries.
  void opts;
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

/**
 * Error subtypes thrown by context-io. Caller can `instanceof` to discriminate.
 */

export class LockContentionError extends Error {
  override readonly name = "LockContentionError";
  constructor(public readonly path: string, public readonly attempts: number, cause?: unknown) {
    super(`lock contention on ${path} after ${attempts} attempt(s)`);
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export class WriteError extends Error {
  override readonly name = "WriteError";
  constructor(public readonly path: string, msg: string, cause?: unknown) {
    super(`write failed for ${path}: ${msg}`);
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export class FsyncError extends Error {
  override readonly name = "FsyncError";
  constructor(public readonly path: string, msg: string, cause?: unknown) {
    super(`fsync failed for ${path}: ${msg}`);
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export class PartialParseError extends Error {
  override readonly name = "PartialParseError";
  constructor(public readonly path: string, public readonly lastError: unknown) {
    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    super(`partial/invalid YAML at ${path}: ${detail}`);
    (this as { cause?: unknown }).cause = lastError;
  }
}

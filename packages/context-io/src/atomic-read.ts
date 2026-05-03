import { promises as fs } from "node:fs";
import { parse as parseYaml } from "yaml";

import { PartialParseError } from "./errors.js";

export interface AtomicReadOptions {
  /** Number of retries on transient parse failure. Default: 3. */
  parseRetries?: number;
  /** Delay (ms) between retries. Default: 50. */
  retryDelayMs?: number;
  /** Parse function override. Test seam — production code should not use. */
  _parser?: (raw: string) => unknown;
}

/**
 * Read the file as a string, but with parse-retry resilience:
 *   - Reads the file (no lock — atomic rename guarantees no half-written state).
 *   - Tries to YAML.parse it. If the parse succeeds, returns the raw string.
 *   - On parse failure (rare narrow window on slow FS), retries up to N times.
 *   - On final failure, throws PartialParseError.
 *
 * Returns the raw string so the caller decides whether to Zod-validate.
 */
export async function atomicRead(
  targetPath: string,
  opts: AtomicReadOptions = {},
): Promise<string> {
  const retries = opts.parseRetries ?? 3;
  const delay = opts.retryDelayMs ?? 50;
  const parse = opts._parser ?? parseYaml;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let raw: string;
    try {
      raw = await fs.readFile(targetPath, "utf8");
    } catch (err) {
      // ENOENT and friends — propagate untouched per spec.
      throw err;
    }

    try {
      // We don't keep the parsed value — just verify it's parseable.
      parse(raw);
      return raw;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(delay);
        continue;
      }
    }
  }

  throw new PartialParseError(targetPath, lastErr);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

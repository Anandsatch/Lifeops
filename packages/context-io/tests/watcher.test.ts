import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import { watchContext } from "../src/watcher.js";
import { atomicWrite } from "../src/atomic-write.js";
import { _resetWatcherBus } from "../src/watcher-bus.js";

let dir: string;
let target: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctxio-wt-"));
  target = path.join(dir, "ctx.yaml");
  await fs.writeFile(target, "init: 0\n", "utf8");
  _resetWatcherBus();
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("watchContext", () => {
  it("detects external file change", async () => {
    const seen: string[] = [];
    const handle = watchContext(target, (raw) => seen.push(raw));
    await sleep(150); // settle initial scan

    // External writer (not via atomicWrite) — simulate another process.
    await fs.writeFile(target, "external: 1\n", "utf8");

    // Wait for chokidar awaitWriteFinish + debounce.
    await sleep(600);
    await handle.close();

    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(seen.at(-1)).toBe("external: 1\n");
  });

  it("debounces rapid changes into a single callback", async () => {
    const seen: string[] = [];
    const handle = watchContext(target, (raw) => seen.push(raw));
    await sleep(150);

    for (let i = 0; i < 5; i++) {
      await fs.writeFile(target, `n: ${i}\n`, "utf8");
      await sleep(10);
    }

    await sleep(700);
    await handle.close();

    // We don't assert exactly 1 because chokidar's awaitWriteFinish itself
    // batches; combined with our 150ms debounce we should see no more than 2.
    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(seen.length).toBeLessThanOrEqual(2);
    expect(seen.at(-1)).toBe("n: 4\n");
  });

  it("suppresses events from atomicWrite (self-write)", async () => {
    const seen: string[] = [];
    const handle = watchContext(target, (raw) => seen.push(raw));
    await sleep(150);

    await atomicWrite(target, "self: 1\n");
    await sleep(500);
    await handle.close();

    expect(seen).toHaveLength(0);
  });

  it("close() stops further callbacks", async () => {
    const seen: string[] = [];
    const handle = watchContext(target, (raw) => seen.push(raw));
    await sleep(150);
    await handle.close();

    await fs.writeFile(target, "after-close: 1\n", "utf8");
    await sleep(500);

    expect(seen).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import lockfile from "proper-lockfile";

import { atomicWrite } from "../src/atomic-write.js";
import { LockContentionError, WriteError } from "../src/errors.js";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctxio-aw-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("atomicWrite — happy path", () => {
  it("writes the file with the given contents", async () => {
    const target = path.join(dir, "ctx.yaml");
    await atomicWrite(target, "hello: world\n");
    const got = await fs.readFile(target, "utf8");
    expect(got).toBe("hello: world\n");
  });

  it("overwrites an existing file atomically", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "old: 1\n", "utf8");
    await atomicWrite(target, "new: 2\n");
    expect(await fs.readFile(target, "utf8")).toBe("new: 2\n");
  });

  it("leaves no tmpfile orphans on success", async () => {
    const target = path.join(dir, "ctx.yaml");
    await atomicWrite(target, "x: 1\n");
    const entries = await fs.readdir(dir);
    expect(entries.filter((e) => e.includes(".tmp."))).toHaveLength(0);
  });
});

describe("atomicWrite — lock contention", () => {
  it("throws LockContentionError when another holder keeps the lock", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "init: 1\n", "utf8");

    // Externally hold the lock for longer than the retry budget.
    const release = await lockfile.lock(target, {
      stale: 10_000,
      realpath: false,
    });

    try {
      await expect(atomicWrite(target, "blocked: 1\n")).rejects.toBeInstanceOf(
        LockContentionError,
      );
    } finally {
      await release();
    }
  });

  it("leaves no tmpfile orphans when lock acquisition fails", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "init: 1\n", "utf8");

    const release = await lockfile.lock(target, {
      stale: 10_000,
      realpath: false,
    });

    try {
      await expect(atomicWrite(target, "blocked: 1\n")).rejects.toBeInstanceOf(
        LockContentionError,
      );
      const entries = await fs.readdir(dir);
      expect(entries.filter((e) => e.includes(".tmp."))).toHaveLength(0);
    } finally {
      await release();
    }
  });
});

describe("atomicWrite — symlink rejection (codex review fix)", () => {
  it("rejects writing through a symlink with WriteError", async () => {
    const real = path.join(dir, "real.yaml");
    const link = path.join(dir, "link.yaml");
    await fs.writeFile(real, "x: 1\n", "utf8");
    await fs.symlink(real, link);
    await expect(atomicWrite(link, "y: 2\n")).rejects.toBeInstanceOf(WriteError);
    // Real file untouched; symlink intact.
    expect(await fs.readFile(real, "utf8")).toBe("x: 1\n");
    expect((await fs.lstat(link)).isSymbolicLink()).toBe(true);
  });
});

describe("atomicWrite — concurrent same-process writes serialize", () => {
  it("all writes complete and final state is one of them", async () => {
    const target = path.join(dir, "ctx.yaml");
    const writes = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        atomicWrite(target, `n: ${i}\n`).then(() => `n: ${i}\n`),
      ),
    );
    const final = await fs.readFile(target, "utf8");
    expect(writes).toContain(final);
    // No half-written: parseable as one of the write payloads.
  });
});

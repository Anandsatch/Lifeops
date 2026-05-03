import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { parse as realParse } from "yaml";

import { atomicRead } from "../src/atomic-read.js";
import { PartialParseError } from "../src/errors.js";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctxio-ar-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("atomicRead — happy path", () => {
  it("returns the raw string for a valid YAML", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "hello: world\n", "utf8");
    expect(await atomicRead(target)).toBe("hello: world\n");
  });
});

describe("atomicRead — retries", () => {
  it("retries transient parse failures and eventually succeeds", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "hello: world\n", "utf8");

    let calls = 0;
    const flaky = (src: string) => {
      calls += 1;
      if (calls < 3) throw new Error("transient parse fail");
      return realParse(src);
    };

    const result = await atomicRead(target, {
      parseRetries: 3,
      retryDelayMs: 1,
      _parser: flaky,
    });
    expect(result).toBe("hello: world\n");
    expect(calls).toBe(3);
  });

  it("throws PartialParseError after retries exhausted", async () => {
    const target = path.join(dir, "ctx.yaml");
    await fs.writeFile(target, "hello: world\n", "utf8");

    await expect(
      atomicRead(target, {
        parseRetries: 2,
        retryDelayMs: 1,
        _parser: () => {
          throw new Error("persistent parse fail");
        },
      }),
    ).rejects.toBeInstanceOf(PartialParseError);
  });
});

describe("atomicRead — file missing", () => {
  it("throws ENOENT untouched", async () => {
    const target = path.join(dir, "nope.yaml");
    await expect(atomicRead(target)).rejects.toMatchObject({ code: "ENOENT" });
  });
});

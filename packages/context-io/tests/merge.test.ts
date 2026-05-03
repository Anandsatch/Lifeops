import { describe, it, expect } from "vitest";
import type { Provenance } from "@lifeops/schema";
import { mergeRecord } from "../src/merge.js";

function prov(source: Provenance["source"], iso: string): Provenance {
  return { source, last_verified_at: iso };
}

describe("mergeRecord — precedence", () => {
  it("human beats gmail-receipt", () => {
    const cur = { points: 100, provenance: prov("human", "2026-04-01T00:00:00Z") };
    const inc = { points: 200, provenance: prov("gmail-receipt", "2026-04-29T00:00:00Z") };
    const merged = mergeRecord(cur, inc);
    expect(merged.points).toBe(100);
    expect(merged.provenance.source).toBe("human");
  });

  it("gmail-receipt beats benefit-pack-default", () => {
    const cur = { points: 50, provenance: prov("benefit-pack-default", "2026-04-29T00:00:00Z") };
    const inc = { points: 75, provenance: prov("gmail-receipt", "2026-04-01T00:00:00Z") };
    const merged = mergeRecord(cur, inc);
    expect(merged.points).toBe(75);
    expect(merged.provenance.source).toBe("gmail-receipt");
  });

  it("on tied precedence, newer last_verified_at wins", () => {
    const cur = { points: 100, provenance: prov("gmail-statement", "2026-04-01T00:00:00Z") };
    const inc = { points: 200, provenance: prov("gmail-statement", "2026-04-29T00:00:00Z") };
    const merged = mergeRecord(cur, inc);
    expect(merged.points).toBe(200);
  });

  it("on exact tie, incoming wins (idempotent on replay)", () => {
    const stamp = "2026-04-29T00:00:00Z";
    const cur = { points: 100, provenance: prov("human", stamp) };
    const inc = { points: 200, provenance: prov("human", stamp) };
    const merged = mergeRecord(cur, inc);
    expect(merged.points).toBe(200);
  });
});

describe("mergeRecord — multi-field", () => {
  it("uses per-field provenance overrides when present", () => {
    const cur = {
      points: 100,
      status: "gold",
      provenance: prov("gmail-statement", "2026-04-29T00:00:00Z"),
      _provenance: {
        // points is human-locked, status is just gmail
        points: prov("human", "2026-04-15T00:00:00Z"),
      },
    };
    const inc = {
      points: 200,
      status: "platinum",
      provenance: prov("gmail-statement", "2026-04-30T00:00:00Z"),
    };
    const merged = mergeRecord(cur, inc);
    // points: human in cur beats gmail-statement in inc
    expect(merged.points).toBe(100);
    // status: gmail-statement tied; newer (incoming) wins
    expect(merged.status).toBe("platinum");
    // recorded per-field provenance reflects the chosen source
    expect(merged._provenance?.["points"]?.source).toBe("human");
    expect(merged._provenance?.["status"]?.source).toBe("gmail-statement");
  });
});

describe("mergeRecord — idempotence", () => {
  it("merge(x, x) preserves field values and provenance", () => {
    const x = {
      points: 123,
      provenance: prov("human", "2026-04-29T00:00:00Z"),
    };
    const merged = mergeRecord(x, x);
    expect(merged.points).toBe(123);
    expect(merged.provenance).toEqual(x.provenance);
  });

  it("merging twice is stable (merge(merge(a,b), b) == merge(a,b))", () => {
    const a = { points: 1, provenance: prov("human", "2026-04-01T00:00:00Z") };
    const b = { points: 2, provenance: prov("gmail-receipt", "2026-04-29T00:00:00Z") };
    const m1 = mergeRecord(a, b);
    const m2 = mergeRecord(m1, b);
    expect(m1.points).toBe(m2.points);
    expect(m1.provenance.source).toBe(m2.provenance.source);
  });
});

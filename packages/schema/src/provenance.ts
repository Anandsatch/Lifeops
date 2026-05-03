import { z } from "zod";

/**
 * Source — ordered from highest to lowest precedence per Sprint 1 brief.
 * The merge protocol (E2-T5) consumes this ordering directly.
 */
export const Source = z.enum([
  "human",
  "gmail-receipt",
  "gmail-statement",
  "benefit-pack-default",
]);
export type Source = z.infer<typeof Source>;

/**
 * Numeric precedence of each source. Higher wins on merge.
 * Exported so the merge protocol does not redefine it.
 */
export const SOURCE_PRECEDENCE: Record<Source, number> = {
  "human": 4,
  "gmail-receipt": 3,
  "gmail-statement": 2,
  "benefit-pack-default": 1,
};

/**
 * Provenance — required on every record. last_verified_at is a strict
 * ISO-8601 datetime (with offset).
 */
export const Provenance = z.object({
  source: Source,
  last_verified_at: z.string().datetime({ offset: true }),
});
export type Provenance = z.infer<typeof Provenance>;

/**
 * Per-field provenance map (optional sidecar at the record level).
 * Keys are field paths within the record (e.g. "points", "annual_fee.amount").
 * The merge protocol (E2-T5) reads/writes this when merging individual fields.
 *
 * Per Sprint 1 brief: this is an additive extension to the spec — flagged
 * to PM so they're aware it's per-record (not the top-level _meta sidecar
 * shown in design v2.2). See report.
 */
export const FieldProvenanceMap = z.record(z.string(), Provenance);
export type FieldProvenanceMap = z.infer<typeof FieldProvenanceMap>;

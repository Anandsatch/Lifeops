import {
  Provenance,
  type FieldProvenanceMap,
  SOURCE_PRECEDENCE,
} from "@lifeops/schema";

/**
 * Records that participate in field-level merging carry a `provenance` block
 * (the record-level default) and an optional `_provenance` map for per-field
 * overrides.
 */
export interface MergeableRecord {
  provenance: Provenance;
  _provenance?: FieldProvenanceMap;
  [key: string]: unknown;
}

/**
 * Pure field-level merge.
 *
 * Per Sprint 1 brief: precedence ladder is
 *   human > gmail-receipt > gmail-statement > benefit-pack-default
 *
 * For each leaf field path:
 *   - Look up provenance: per-field override (`_provenance[path]`) if present,
 *     else the record-level default (`provenance`).
 *   - Higher-precedence wins. On tie, newer last_verified_at wins. On exact
 *     tie, incoming wins (so re-applying an idempotent batch doesn't churn).
 *
 * Returns a new record with the merged leaves and a fresh `_provenance` map
 * recording the chosen provenance per field.
 */
export function mergeRecord<T extends MergeableRecord>(current: T, incoming: T): T {
  const out: Record<string, unknown> = {};
  const prov: Record<string, Provenance> = {};

  const keys = new Set<string>([...Object.keys(current), ...Object.keys(incoming)]);
  keys.delete("provenance");
  keys.delete("_provenance");

  for (const key of keys) {
    const inCurrent = key in current;
    const inIncoming = key in incoming;

    if (inCurrent && !inIncoming) {
      out[key] = current[key];
      prov[key] = provenanceFor(current, key);
      continue;
    }
    if (!inCurrent && inIncoming) {
      out[key] = incoming[key];
      prov[key] = provenanceFor(incoming, key);
      continue;
    }

    const curProv = provenanceFor(current, key);
    const incProv = provenanceFor(incoming, key);
    const winner = pickWinner(curProv, incProv);
    if (winner === "current") {
      out[key] = current[key];
      prov[key] = curProv;
    } else {
      out[key] = incoming[key];
      prov[key] = incProv;
    }
  }

  // Record-level provenance: same precedence rule.
  const recordWinner = pickWinner(current.provenance, incoming.provenance);
  const winningRecordProv =
    recordWinner === "current" ? current.provenance : incoming.provenance;

  return {
    ...(out as T),
    provenance: winningRecordProv,
    _provenance: prov,
  } as T;
}

function provenanceFor(rec: MergeableRecord, key: string): Provenance {
  return rec._provenance?.[key] ?? rec.provenance;
}

function pickWinner(a: Provenance, b: Provenance): "current" | "incoming" {
  const aP = SOURCE_PRECEDENCE[a.source];
  const bP = SOURCE_PRECEDENCE[b.source];
  if (aP > bP) return "current";
  if (bP > aP) return "incoming";
  // Tie: newer last_verified_at wins.
  if (a.last_verified_at > b.last_verified_at) return "current";
  if (b.last_verified_at > a.last_verified_at) return "incoming";
  // Exact tie — incoming wins (idempotency on replays).
  return "incoming";
}

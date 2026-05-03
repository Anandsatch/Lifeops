import { z } from "zod";
import { CurrencyCode } from "./common.js";
import { Cadence } from "./cadence.js";
import { Provenance, FieldProvenanceMap } from "./provenance.js";

/**
 * BenefitDefinition — the RULE.
 *
 * Sourced from card T&Cs. Stable across periods. The differentiation thesis
 * (per outputs/competitor-scan.md) lives in this rule/instance split:
 * competitors conflate balance and rule, leading to bugs.
 */
export const BenefitDefinition = z.object({
  id: z.string().min(1),
  card_id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencyCode,
  cadence: Cadence,
  eligible_merchants: z.array(z.string().min(1)),
  description: z.string(),
  provenance: Provenance,
  _provenance: FieldProvenanceMap.optional(),
});
export type BenefitDefinition = z.infer<typeof BenefitDefinition>;

import { z } from "zod";
import { IsoDate } from "./common.js";
import { Provenance, FieldProvenanceMap } from "./provenance.js";

/**
 * CreditInstance — the INSTANCE.
 *
 * Ephemeral, ties to a BenefitDefinition. One per period. Tracks how much
 * of the period's benefit has been used.
 */
export const CreditInstance = z
  .object({
    id: z.string().min(1),
    definition_id: z.string().min(1),
    period_start: IsoDate,
    period_end: IsoDate,
    amount_total: z.number().nonnegative(),
    amount_used: z.number().nonnegative(),
    expires_at: IsoDate,
    provenance: Provenance,
    _provenance: FieldProvenanceMap.optional(),
  })
  .refine((c) => c.amount_used <= c.amount_total, {
    message: "amount_used must be <= amount_total",
    path: ["amount_used"],
  })
  .refine((c) => c.period_start <= c.period_end, {
    message: "period_start must be <= period_end",
    path: ["period_end"],
  });
export type CreditInstance = z.infer<typeof CreditInstance>;

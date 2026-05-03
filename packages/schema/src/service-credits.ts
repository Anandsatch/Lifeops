import { z } from "zod";
import { CurrencyCode, IsoDate } from "./common.js";
import { Cadence } from "./cadence.js";
import { Provenance, FieldProvenanceMap } from "./provenance.js";

export const ServiceCredit = z.object({
  id: z.string().min(1),
  vendor: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencyCode,
  cadence: Cadence,
  expires_at: IsoDate,
  provenance: Provenance,
  _provenance: FieldProvenanceMap.optional(),
});
export type ServiceCredit = z.infer<typeof ServiceCredit>;

import { z } from "zod";
import { IsoDate } from "./common.js";
import { Provenance, FieldProvenanceMap } from "./provenance.js";

export const LoyaltyStatus = z.enum([
  "none",
  "silver",
  "gold",
  "platinum",
  "titanium",
  "diamond",
  "ambassador",
  "globalist",
  "explorist",
  "discoverist",
  "lifetime",
]);
export type LoyaltyStatus = z.infer<typeof LoyaltyStatus>;

export const FreeNightCert = z.object({
  category_max: z.string().min(1),
  expires_at: IsoDate,
  count: z.number().int().nonnegative(),
});
export type FreeNightCert = z.infer<typeof FreeNightCert>;

export const Loyalty = z.object({
  program_id: z.string().min(1),
  status: LoyaltyStatus,
  points: z.number().int().nonnegative(),
  free_night_certs: z.array(FreeNightCert).optional(),
  provenance: Provenance,
  _provenance: FieldProvenanceMap.optional(),
});
export type Loyalty = z.infer<typeof Loyalty>;

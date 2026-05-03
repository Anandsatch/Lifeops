import { z } from "zod";
import { IsoDate, Money } from "./common.js";
import { Provenance, FieldProvenanceMap } from "./provenance.js";

export const CardStatus = z.enum(["active", "closed", "downgraded", "product_change"]);
export type CardStatus = z.infer<typeof CardStatus>;

export const TransferPartner = z.object({
  program: z.string().min(1),
  ratio: z.string().regex(/^\d+:\d+$/, "ratio must look like '1:1' or '2:1'"),
});
export type TransferPartner = z.infer<typeof TransferPartner>;

export const Card = z.object({
  id: z.string().min(1),
  issuer: z.string().min(1),
  product: z.string().min(1),
  annual_fee: Money,
  anchor_date: IsoDate,
  status: CardStatus,
  transfer_partners: z.array(TransferPartner).optional(),
  provenance: Provenance,
  _provenance: FieldProvenanceMap.optional(),
});
export type Card = z.infer<typeof Card>;

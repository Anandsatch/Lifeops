import { z } from "zod";
import { IsoDateTime } from "./common.js";

export const SCHEMA_VERSION = "0.1.0" as const;

export const Meta = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  last_modified: IsoDateTime,
  source_app: z.string().min(1),
  notes: z.string().optional(),
});
export type Meta = z.infer<typeof Meta>;

import { zodToJsonSchema } from "zod-to-json-schema";
import { PersonalContext } from "./personal-context.js";

/**
 * JSON Schema for the canonical PersonalContext shape.
 *
 * E8-T0 republishes this in the OSS schema repo. Keep this file thin so that
 * downstream consumers can import { personalContextJsonSchema } and ship.
 */
export const personalContextJsonSchema = zodToJsonSchema(PersonalContext, {
  name: "PersonalContext",
  $refStrategy: "root",
});

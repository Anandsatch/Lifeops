import { z } from "zod";
import { Card } from "./cards.js";
import { Loyalty } from "./loyalty.js";
import { ServiceCredit } from "./service-credits.js";
import { BenefitDefinition } from "./benefit-definitions.js";
import { CreditInstance } from "./credit-instances.js";
import { Meta } from "./meta.js";

export const PersonalContext = z.object({
  _meta: Meta,
  cards: z.array(Card).default([]),
  loyalty: z.array(Loyalty).default([]),
  service_credits: z.array(ServiceCredit).default([]),
  benefit_definitions: z.array(BenefitDefinition).default([]),
  credit_instances: z.array(CreditInstance).default([]),
});
export type PersonalContext = z.infer<typeof PersonalContext>;

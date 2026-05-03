import { z } from "zod";

/** ISO-4217 3-letter currency code (uppercase). */
export const CurrencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, "currency must be a 3-letter ISO-4217 code (uppercase)");
export type CurrencyCode = z.infer<typeof CurrencyCode>;

/** A money amount as {amount, currency}. amount is non-negative. */
export const Money = z.object({
  amount: z.number().nonnegative(),
  currency: CurrencyCode,
});
export type Money = z.infer<typeof Money>;

/** A bare ISO-8601 calendar date YYYY-MM-DD. */
export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO-8601 date YYYY-MM-DD");
export type IsoDate = z.infer<typeof IsoDate>;

/** A strict ISO-8601 datetime with offset. */
export const IsoDateTime = z.string().datetime({ offset: true });
export type IsoDateTime = z.infer<typeof IsoDateTime>;

import { z } from "zod";

/**
 * Cadence — four values for v0.
 *
 * Sprint 1 brief originally cut to {monthly, annual, anniversary}; PM
 * decision 2026-05-03 added quarterly to cover Citi-style quarterly
 * statement credits in the user's real wallet.
 */
export const Cadence = z.enum(["monthly", "quarterly", "annual", "anniversary"]);
export type Cadence = z.infer<typeof Cadence>;

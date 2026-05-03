import { describe, it, expect } from "vitest";
import {
  PersonalContext,
  SCHEMA_VERSION,
  Provenance,
  Card,
  CreditInstance,
} from "../src/index.js";

function makeProvenance() {
  return {
    source: "human" as const,
    last_verified_at: "2026-04-29T19:57:00Z",
  };
}
const validProvenance = makeProvenance();

function validContext() {
  return {
    _meta: {
      schema_version: SCHEMA_VERSION,
      last_modified: "2026-04-29T19:57:00Z",
      source_app: "lifeops-cli",
    },
    cards: [
      {
        id: "amex_gold",
        issuer: "amex",
        product: "gold",
        annual_fee: { amount: 250, currency: "USD" },
        anchor_date: "2024-03-15",
        status: "active",
        transfer_partners: [{ program: "marriott", ratio: "1:1" }],
        provenance: makeProvenance(),
      },
    ],
    loyalty: [
      {
        program_id: "marriott",
        status: "titanium",
        points: 180000,
        provenance: makeProvenance(),
      },
    ],
    service_credits: [
      {
        id: "inkind_balance",
        vendor: "inkind",
        amount: 200,
        currency: "USD",
        cadence: "annual",
        expires_at: "2027-12-31",
        provenance: makeProvenance(),
      },
    ],
    benefit_definitions: [
      {
        id: "amex_gold_dining_def",
        card_id: "amex_gold",
        name: "Amex Gold Dining Credit",
        amount: 10,
        currency: "USD",
        cadence: "monthly",
        eligible_merchants: ["grubhub", "shake_shack"],
        description: "Up to $10/mo at eligible US restaurants",
        provenance: makeProvenance(),
      },
    ],
    credit_instances: [
      {
        id: "amex_gold_dining_2026_04",
        definition_id: "amex_gold_dining_def",
        period_start: "2026-04-01",
        period_end: "2026-04-30",
        amount_total: 10,
        amount_used: 3,
        expires_at: "2026-04-30",
        provenance: makeProvenance(),
      },
    ],
  };
}

describe("PersonalContext.parse — happy path", () => {
  it("round-trips a representative full context", () => {
    const parsed = PersonalContext.parse(validContext());
    expect(parsed.cards[0]?.id).toBe("amex_gold");
    expect(parsed.benefit_definitions[0]?.cadence).toBe("monthly");
    expect(parsed.credit_instances[0]?.amount_used).toBe(3);
  });

  it("applies array defaults when sections omitted", () => {
    const minimal = {
      _meta: {
        schema_version: SCHEMA_VERSION,
        last_modified: "2026-04-29T19:57:00Z",
        source_app: "lifeops-cli",
      },
    };
    const parsed = PersonalContext.parse(minimal);
    expect(parsed.cards).toEqual([]);
    expect(parsed.loyalty).toEqual([]);
  });
});

describe("PersonalContext.parse — failure messages", () => {
  it("rejects invalid cadence on benefit definition", () => {
    const ctx = validContext();
    // weekly is not in the v0 cadence enum (allowed: monthly, quarterly, annual, anniversary).
    (ctx.benefit_definitions[0] as any).cadence = "weekly";
    const result = PersonalContext.safeParse(ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("cadence")
      );
      expect(issue).toBeDefined();
      expect(issue!.message).toMatch(/Invalid enum value|expected/i);
    }
  });

  it("rejects missing provenance.source", () => {
    const ctx = validContext();
    delete (ctx.cards[0]!.provenance as any).source;
    const result = PersonalContext.safeParse(ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "cards.0.provenance.source"
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects malformed last_verified_at (not ISO datetime)", () => {
    const ctx = validContext();
    ctx.cards[0]!.provenance.last_verified_at = "yesterday";
    const result = PersonalContext.safeParse(ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "cards.0.provenance.last_verified_at"
      );
      expect(issue).toBeDefined();
      expect(issue!.message).toMatch(/datetime|ISO/i);
    }
  });

  it("rejects non-3-letter currency", () => {
    const ctx = validContext();
    ctx.cards[0]!.annual_fee.currency = "us";
    const result = PersonalContext.safeParse(ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.join(".").endsWith("currency")
      );
      expect(issue).toBeDefined();
      expect(issue!.message).toMatch(/3-letter ISO/i);
    }
  });

  it("rejects amount_used > amount_total on credit instance", () => {
    const ctx = validContext();
    ctx.credit_instances[0]!.amount_used = 99;
    ctx.credit_instances[0]!.amount_total = 10;
    const result = PersonalContext.safeParse(ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.message.includes("amount_used must be <= amount_total")
      );
      expect(issue).toBeDefined();
    }
  });
});

describe("Provenance schema", () => {
  it("accepts known sources only", () => {
    expect(Provenance.safeParse({ source: "human", last_verified_at: "2026-04-29T19:57:00Z" }).success).toBe(true);
    expect(Provenance.safeParse({ source: "twitter", last_verified_at: "2026-04-29T19:57:00Z" }).success).toBe(false);
  });
});

describe("Card schema corners", () => {
  it("transfer_partners optional", () => {
    const card = {
      id: "x",
      issuer: "amex",
      product: "gold",
      annual_fee: { amount: 0, currency: "USD" },
      anchor_date: "2024-03-15",
      status: "active",
      provenance: validProvenance,
    };
    expect(Card.safeParse(card).success).toBe(true);
  });

  it("rejects bad transfer ratio", () => {
    const card = {
      id: "x",
      issuer: "amex",
      product: "gold",
      annual_fee: { amount: 0, currency: "USD" },
      anchor_date: "2024-03-15",
      status: "active",
      transfer_partners: [{ program: "marriott", ratio: "one-to-one" }],
      provenance: validProvenance,
    };
    expect(Card.safeParse(card).success).toBe(false);
  });
});

describe("CreditInstance period sanity", () => {
  it("rejects period_end before period_start", () => {
    const ci = {
      id: "x",
      definition_id: "y",
      period_start: "2026-04-30",
      period_end: "2026-04-01",
      amount_total: 10,
      amount_used: 0,
      expires_at: "2026-04-30",
      provenance: validProvenance,
    };
    expect(CreditInstance.safeParse(ci).success).toBe(false);
  });
});

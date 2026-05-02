# Competitor Scan — LifeOps: Loyalty/Credit Data for LLMs

## Landscape (5 players)

| Product | Approach in one sentence | Strength | Weakness | Take-home for us |
|---|---|---|---|---|
| **AwardWallet** | Cloud-scraped point balances + expiry tracking across 600+ programs with a B2B parsing API | Broadest program coverage; has a real developer API for loyalty data | No benefit_definitions/credit_instances split; tracks *balances*, not *rules with cadences*; no LLM integration | Their API proves there's B2B appetite for loyalty data, but the schema is balance-centric, not benefit-rule-centric — we can own the layer above |
| **MaxRewards** | Mobile-first app that connects to card accounts via Plaid-style flows and auto-activates offers + tracks statement credits | Best UX for credit tracking; surfaces "you have $7 left on Grubhub this month" | Cloud-only; Plaid dependency; known accuracy failures on partial credit tracking; no public schema, no LLM hook | Confirms the core user pain (partial monthly credit tracking) is real and *not well solved* even by the market leader in this space |
| **CardPointers** | Privacy-first card optimizer (no bank login) that launched an MCP / Claude integration in March 2026 | Only player with a live Claude MCP + ChatGPT integration; strong privacy positioning; CLI on GitHub | MCP exposes static card/offer catalog data, not per-user live credit instances; no partial-usage state; no provenance | **Most important competitive fact**: CardPointers already owns the "credit card + Claude" headline. LifeOps must differentiate on *stateful, instance-level data* (how much credit remains this period) rather than static recommendations |
| **Kudos** | AI-powered browser extension that recommends the right card at checkout and tracks hidden perks passively | VC-backed ($10M), consumer-friendly, "hidden perks" framing resonates | Cloud-first; benefit tracking is notification-based, not queryable/schema-driven; no MCP, no open data | Validates the "benefits you forget to use" positioning; but Kudos is a consumer product, not a power-user schema — different lane |
| **Travel Freely** | Free points/miles tracker with no bank login, focused on award travel math | Zero friction onboarding; trusted by the points-and-miles hobbyist community | Read-only balance tracker; no benefit tracking, no credits, no cadence model; no API | Minimal overlap; proves the no-bank-login, privacy-first UX pattern works for this audience |

---

## Adjacent patterns worth stealing

**1. CardPointers' no-bank-login trust model.** CardPointers built a large user base without ever asking for credentials by relying on manual card-name entry + a curated card database. LifeOps' local YAML approach is the logical extension: the user *is* the source of truth, which eliminates the single biggest trust objection in this space. Lean into this explicitly in positioning.

**2. MaxRewards' "you have $X remaining this month" notification surface.** Users want the pushdown, not just the dashboard. The credit_instance schema that LifeOps defines should be the underlying data model that eventually powers exactly this kind of ephemeral, time-sensitive alert. Ship the schema first; the alert surface is a natural v2.

**3. AwardWallet's B2B parsing API.** AwardWallet productized its scraping infrastructure as an API and sold it to travel portals. LifeOps should consider: the YAML schema + MCP server is itself an embeddable surface. If the schema is open and MIT, third-party MCP hosts could use it. That's a distribution mechanic, not just a product feature.

**4. Kudos' "hidden perks" framing.** Kudos found that users don't think of themselves as missing money — they think of benefits as invisible. "You're leaving $624/year on the table" converts better than "track your credits." LifeOps should front-load the loss-aversion framing in its README and onboarding.

---

## What no competitor does well (the gap)

**1. The rule/instance split — nobody has it.** AwardWallet tracks balances (running totals from scraping). MaxRewards tracks credits (but with accuracy failures on partial usage). CardPointers tracks the static card catalog (what *should* exist). Kudos tracks notifications. **Not one product models the distinction between "Amex Gold gives $10/month at Grubhub" (the rule, stable, sourced from the card's T&C) and "March 2026: $3 of $10 used, $7 remaining, expires Apr 1" (the instance, ephemeral, sourced from a Gmail receipt).** This split is what makes the data useful for an LLM — without it, Claude can't answer "what credits do I still have right now and when do they expire?"

**2. Provenance is completely absent.** No competitor stores *where a fact came from* or *when it was last verified*. AwardWallet's scraper knows when it last fetched, but that's pipeline metadata — it's not surfaced in the schema or queryable by a downstream consumer. LifeOps' `source: gmail_receipt | manual | statement_scrape` + `last_verified_at` fields are genuinely novel in this space. For an LLM context, provenance determines *how much to trust* a fact — a manually entered $10 credit is less reliable than one confirmed by a Gmail receipt 3 days ago. No competitor exposes this signal.

**3. No machine-readable schema anyone can build on.** AwardWallet has a B2B API, but it's proprietary, credentialed, and closed. Adobe's XDM loyalty schema exists but is an enterprise CRM construct (program ID, tier, point balance — no benefit-rule model). The open-source loyalty repos on GitHub are all points-accumulation engines (B2C program operators), not consumer-side benefit-tracking schemas. **There is no published, open JSON/YAML schema for "a person's credit card benefits with cadence and partial usage."** LifeOps publishing one under MIT is a genuine stake-in-the-ground.

---

## Pricing / business model snapshot

The space splits cleanly: cloud-hosted freemium (AwardWallet: free + $49.99/yr Plus; MaxRewards: free + $60/yr Gold; Travel Freely: 100% free; Kudos: free with premium features TBD) versus no-subscription / open-source (CardPointers: free + CardPointers+ at a one-time-ish price, MCP gated behind paid tier). LifeOps' MIT + local-first model is structurally different from every player. The closest analog is CardPointers' privacy-first stance, but CardPointers still requires a cloud account. LifeOps can own "the loyalty schema that runs entirely on your machine" — which is a meaningful unlock for users who won't hand credentials to another SaaS. The risk: open-source means no recurring revenue, so the 5-weekend timeline and MIT license should be treated as a land-grab for schema mindshare, not a business model yet.

---

## Differentiation Summary: LifeOps' Claims vs. the Market

| LifeOps claim | Verdict | Evidence |
|---|---|---|
| **benefit_definitions / credit_instances split** | Genuinely novel | No competitor models rule vs. instance; MaxRewards conflates them and ships bugs as a result |
| **Field-level provenance** (`source`, `last_verified_at`) | Genuinely novel | Not present in any public schema or product data model found |
| **Cadence enum** (monthly / annual / anniversary / quarterly) | Partially overlapping | AwardWallet tracks expiry dates; MaxRewards tracks resets — but neither exposes cadence as a typed, queryable field in a schema |
| **Skill-first / MCP-first** | Partially overlapping | CardPointers already has a Claude MCP (launched March 2026). LifeOps' differentiation must be *what data* is in the MCP (stateful instances with provenance), not the MCP itself |
| **Local YAML you control** | Genuinely novel | Every competitor requires cloud sync. CardPointers is closest (no bank login) but still cloud-hosted. Zero competitors are local-first at the data layer |

---

## Threat Assessment

**If AwardWallet added a Claude skill tomorrow:** They have the API infrastructure to do it. Their data model is balance + expiry only — no partial usage, no cadence, no provenance. A Claude skill built on their data could answer "how many United miles do I have" but *not* "how much of my Amex Gold dining credit is left this month." LifeOps survives this move on schema depth.

**If MaxRewards added a Claude skill tomorrow:** MaxRewards has the closest feature set (partial credit tracking exists, if unreliably). A MaxRewards MCP would be LifeOps' most dangerous competitive move. The differentiator that survives: local-first (MaxRewards requires Plaid/cloud), open schema (MaxRewards is proprietary), and provenance (MaxRewards has no concept of data source quality). LifeOps should ship the MIT schema and MCP reference implementation fast — being first to open-source this schema creates switching costs before MaxRewards can respond.

---

## Verdict in one sentence

The opportunity for LifeOps is to own the open, local-first schema layer for personal benefit data — specifically the rule/instance split and field-level provenance that every existing product conflates or ignores — in a market where the only player with LLM integration (CardPointers) exposes only static card catalog data, not stateful, expiring credit instances.

// Pure projection from PersonalContext → DashboardModel. No side effects,
// no hooks — easy to unit-test once vitest UI tests land.
//
// W1 risky-corner #7 idempotency contract: this function is called fresh
// each tick of the watcher. Same input → same output, no stored state.

import type {
  Card,
  CreditInstance,
  PersonalContext,
  BenefitDefinition,
} from '@lifeops/schema';

export interface DashboardModel {
  /** Most-expiring live credit. Undefined when nothing is live. */
  hero: HeroCard | undefined;
  chips: readonly ChipCard[];
  inventory: InventorySummary;
  /** Number of credit_instances available for the user-facing list. */
  totalCreditInstances: number;
}

export interface HeroCard extends ChipCard {
  /** Long marketing label e.g. "Amex Gold · Monthly dining credit". */
  longLabel: string;
  /** Sample merchant from eligible_merchants — drives the foot copy. */
  merchant: string;
  /** Reset clause copy e.g. "resets May 31". */
  resetCopy: string;
}

export interface ChipCard {
  id: string;
  /** CSS color value — either a brand-token var() or grey fallback. */
  bgColor: string;
  /** Short label e.g. "Amex Gold". */
  issuerLabel: string;
  /** Program scope e.g. "Monthly dining". */
  programLabel: string;
  /** Merchant or program tag visible on the chip. */
  merchant: string;
  /** Days remaining until expires_at. Negative if past. */
  daysRemaining: number;
  /** Hours-of-current-day component for the countdown. */
  hoursRemaining: number;
  /** Currency-naive whole-dollar remaining (amount_total - amount_used). */
  amountRemaining: number;
  amountTotal: number;
  amountUsed: number;
  currency: string;
}

export interface InventorySummary {
  cardCount: number;
  loyaltyCount: number;
  serviceCreditCount: number;
}

const BRAND_COLOR_BY_ISSUER: Record<string, string> = {
  amex:    'var(--lo-amex)',
  chase:   'var(--lo-chase)',
  citi:    'var(--lo-chase)',     // close enough for v0
  capital_one: 'var(--lo-grey-card)',
  marriott: 'var(--lo-marriott)',
  hyatt:    'var(--lo-hyatt)',
  hilton:   'var(--lo-grey-card)',
  delta:    'var(--lo-delta)',
  united:   'var(--lo-united)',
  british_airways: 'var(--lo-ba)',
  alaska:   'var(--lo-grey-card)',
  american: 'var(--lo-grey-card)',
};

const ISSUER_LABEL: Record<string, string> = {
  amex: 'Amex',
  chase: 'Chase',
  citi: 'Citi',
  capital_one: 'Capital One',
  marriott: 'Marriott',
  hyatt: 'Hyatt',
  hilton: 'Hilton',
  delta: 'Delta',
  united: 'United',
  british_airways: 'British Airways',
  alaska: 'Alaska',
  american: 'American',
};

const PRODUCT_LABEL: Record<string, string> = {
  gold: 'Gold',
  platinum: 'Platinum',
  sapphire_reserve: 'Sapphire Reserve',
  sapphire_preferred: 'Sapphire Preferred',
  reserve: 'Reserve',
  premium: 'Premium',
};

function titlecase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function issuerLabel(card: Card): string {
  const issuer = ISSUER_LABEL[card.issuer] ?? titlecase(card.issuer);
  const product = PRODUCT_LABEL[card.product] ?? titlecase(card.product);
  return `${issuer} ${product}`;
}

function brandColor(issuer: string): string {
  return BRAND_COLOR_BY_ISSUER[issuer] ?? 'var(--lo-grey-card)';
}

/** Days/hours remaining from `now` until midnight at end of `expiresAt` date.
 *  We treat expires_at as inclusive end-of-day in user's locale. */
function parseIsoDate(expiresAt: string): { y: number; m: number; d: number } {
  // IsoDate schema enforces YYYY-MM-DD via regex, so the parts always
  // exist by the time we get here. Defaulting to 0 keeps tsc happy
  // under exactOptionalPropertyTypes without runtime surprise.
  const [y, m, d] = expiresAt.split('-').map((p) => Number.parseInt(p, 10));
  return { y: y ?? 0, m: m ?? 1, d: d ?? 1 };
}

function timeRemaining(expiresAt: string, now: Date): { days: number; hours: number } {
  // Treat expires_at as inclusive end-of-day in user's locale.
  const { y, m, d } = parseIsoDate(expiresAt);
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
  const diffMs = endOfDay.getTime() - now.getTime();
  if (diffMs <= 0) return { days: 0, hours: 0 };
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  return { days, hours };
}

function formatResetMonthDay(expiresAt: string): string {
  const { y, m, d } = parseIsoDate(expiresAt);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ProjectionContext {
  cardById: Map<string, Card>;
  defById: Map<string, BenefitDefinition>;
}

function buildIndex(context: PersonalContext): ProjectionContext {
  return {
    cardById: new Map(context.cards.map((c) => [c.id, c])),
    defById: new Map(context.benefit_definitions.map((d) => [d.id, d])),
  };
}

function chipFromInstance(
  instance: CreditInstance,
  ctx: ProjectionContext,
  now: Date,
): ChipCard | undefined {
  const def = ctx.defById.get(instance.definition_id);
  if (!def) return undefined;
  const card = ctx.cardById.get(def.card_id);
  if (!card) return undefined;

  const { days, hours } = timeRemaining(instance.expires_at, now);
  return {
    id: instance.id,
    bgColor: brandColor(card.issuer),
    issuerLabel: issuerLabel(card),
    programLabel: titlecase(def.name),
    merchant: def.eligible_merchants[0] ? titlecase(def.eligible_merchants[0]) : '—',
    daysRemaining: days,
    hoursRemaining: hours,
    amountRemaining: Math.max(0, instance.amount_total - instance.amount_used),
    amountTotal: instance.amount_total,
    amountUsed: instance.amount_used,
    currency: def.currency,
  };
}

export function projectDashboard(
  context: PersonalContext,
  now: Date = new Date(),
): DashboardModel {
  const ctx = buildIndex(context);

  // Only consider unexpired instances with remaining balance > 0.
  const live = context.credit_instances
    .filter((ci) => ci.amount_used < ci.amount_total)
    .filter((ci) => timeRemaining(ci.expires_at, now).days >= 0);

  const sorted = [...live].sort((a, b) => a.expires_at.localeCompare(b.expires_at));

  const heroInstance = sorted[0];
  let hero: HeroCard | undefined;
  if (heroInstance) {
    const chip = chipFromInstance(heroInstance, ctx, now);
    const def = ctx.defById.get(heroInstance.definition_id);
    if (chip && def) {
      const card = ctx.cardById.get(def.card_id)!;
      hero = {
        ...chip,
        longLabel: `${issuerLabel(card)} · ${titlecase(def.name)}`,
        merchant: def.eligible_merchants[0]
          ? titlecase(def.eligible_merchants[0]).toUpperCase()
          : '—',
        resetCopy: `resets ${formatResetMonthDay(heroInstance.expires_at)}`,
      };
    }
  }

  const chips = sorted
    .slice(1, 6)
    .map((ci) => chipFromInstance(ci, ctx, now))
    .filter((c): c is ChipCard => c !== undefined);

  return {
    hero,
    chips,
    inventory: {
      cardCount: context.cards.length,
      loyaltyCount: context.loyalty.length,
      serviceCreditCount: context.service_credits.length,
    },
    totalCreditInstances: live.length,
  };
}

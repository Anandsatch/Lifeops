// E4-T4 — Dashboard (UC12).
//
// Hierarchy per spec §UC12 + DESIGN.md §3.1: ONE hero credit card,
// strip of next 4-5 expiring chips, collapsed accordion footer with
// inventory totals. "Three coequal sections" (the v2.1 layout) was
// explicitly rejected — focal pull is the most-expiring credit.
//
// Reads PersonalContext via usePersonalContext() (E4-T8). File-watching
// (E4-T12) lives in the same hook and re-derives the entire model on
// each tick — no stored counters, no merging.

import type { ReactElement } from 'react';
import { usePersonalContext } from '../state/contextStore';
import { projectDashboard, type ChipCard, type HeroCard } from '../state/dashboardProjection';

export function Dashboard(): ReactElement {
  const status = usePersonalContext();

  if (status.kind === 'loading') return <DashboardLoading />;
  if (status.kind === 'error') return <DashboardError message={status.message} />;

  const model = projectDashboard(status.context);
  return (
    <div
      className="lo-content"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-8)' }}
    >
      <DashboardHeader source={status.source} />
      {model.hero ? <Hero hero={model.hero} /> : <NoHero />}
      {model.chips.length > 0 && <ChipStrip chips={model.chips} />}
      <InventoryFoot
        cardCount={model.inventory.cardCount}
        loyaltyCount={model.inventory.loyaltyCount}
        serviceCreditCount={model.inventory.serviceCreditCount}
      />
    </div>
  );
}

function DashboardHeader({ source }: { source: 'user' | 'demo' }): ReactElement {
  return (
    <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="lo-section-label">Expiring next — top priority</span>
        <h1 style={{ fontSize: 'var(--lo-fs-h1)', fontWeight: 600, margin: 0, letterSpacing: 'var(--lo-tracking-snug)' }}>
          What you have, today.
        </h1>
      </div>
      <SourceBadge source={source} />
    </header>
  );
}

function SourceBadge({ source }: { source: 'user' | 'demo' }): ReactElement {
  const isDemo = source === 'demo';
  return (
    <span
      title={isDemo ? 'Bundled demo data — replace via the in-app forms (W3) or pc init' : 'From ~/.personal-context.yaml'}
      style={{
        fontFamily: 'var(--lo-font-mono)',
        fontSize: 'var(--lo-fs-mini)',
        letterSpacing: 'var(--lo-tracking-label)',
        textTransform: 'uppercase',
        color: isDemo ? 'var(--lo-ink-muted)' : 'var(--lo-amex)',
        border: '1px solid var(--lo-hairline)',
        borderRadius: 'var(--lo-r-pill)',
        padding: '4px 10px',
        background: 'var(--lo-warm-white)',
      }}
    >
      {isDemo ? '◐ demo data' : '● live'}
    </span>
  );
}

function Hero({ hero }: { hero: HeroCard }): ReactElement {
  const used = hero.amountUsed;
  const total = hero.amountTotal;
  const remaining = hero.amountRemaining;
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div
      className="lo-hero"
      style={{
        background: hero.bgColor,
        // Override gallery's hard 720x360 — let it grow with content
        // inside our lo-content padding (56px gutters → ~1216px wide
        // at 1440 window). The hero card stays focal and centred.
        width: '100%',
        maxWidth: 1080,
        height: 'auto',
        minHeight: 360,
        alignSelf: 'center',
      }}
    >
      <div className="lo-hero__label">{hero.longLabel}</div>
      <div className="lo-hero__mid">
        <div className="lo-hero__countdown">
          {hero.daysRemaining}d
          <span className="lo-hero__small">{` ${String(hero.hoursRemaining).padStart(2, '0')}h`}</span>
        </div>
        <div className="lo-hero__progress">
          <div className="lo-hero__amt">
            <span className="lo-hero__currency">$</span>
            {remaining}
            <span className="lo-hero__of">left of <strong>${total}</strong></span>
          </div>
          <div className="lo-bar">
            <div className="lo-bar__fill" style={{ width: `${100 - usedPct}%` }} />
          </div>
          <div className="lo-hero__hint">
            <span>${used} used this cycle</span>
            <span>{hero.resetCopy}</span>
          </div>
        </div>
      </div>
      <div className="lo-hero__foot">
        <div>
          <div className="lo-hero__merchant">{hero.merchant}</div>
          <div className="lo-hero__ledger">
            Last used ${used} · view ledger →
          </div>
        </div>
        <button
          type="button"
          className="lo-hero__cta"
          // Use-credit interaction (E4-T10) is W3; render the CTA so the
          // visual contract matches the gallery. Click is a no-op for now.
          onClick={() => undefined}
          aria-disabled
        >
          LOG SPEND  →
        </button>
      </div>
    </div>
  );
}

function NoHero(): ReactElement {
  return (
    <div
      style={{
        background: 'var(--lo-warm-white)',
        border: '1px solid var(--lo-hairline)',
        borderRadius: 'var(--lo-r-card)',
        padding: 'var(--lo-space-10)',
        textAlign: 'center',
        color: 'var(--lo-ink-muted)',
        alignSelf: 'center',
        maxWidth: 1080,
        width: '100%',
      }}
    >
      <p style={{ margin: 0, fontSize: 'var(--lo-fs-h2)', fontWeight: 600, color: 'var(--lo-ink)' }}>
        No live credits this cycle.
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 'var(--lo-fs-body)' }}>
        Add a card or service credit via the in-app forms (W3) or
        edit <span className="lo-mono">~/.personal-context.yaml</span> directly.
      </p>
    </div>
  );
}

function ChipStrip({ chips }: { chips: readonly ChipCard[] }): ReactElement {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-4)' }}>
      <span className="lo-section-label">Next up</span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${chips.length}, minmax(0, 1fr))`,
          gap: 'var(--lo-space-4)',
        }}
      >
        {chips.map((chip) => (
          <Chip key={chip.id} chip={chip} />
        ))}
      </div>
    </section>
  );
}

function Chip({ chip }: { chip: ChipCard }): ReactElement {
  return (
    <div className="lo-chip" style={{ background: chip.bgColor }}>
      <div className="lo-chip__top">
        <span className="lo-chip__cd">{chip.daysRemaining}d</span>
        <span className="lo-chip__amt">
          <span className="lo-chip__currency">$</span>
          {chip.amountRemaining}
        </span>
      </div>
      <div>
        <div className="lo-chip__merchant">{chip.merchant}</div>
        <div className="lo-chip__prog">{chip.issuerLabel}</div>
      </div>
    </div>
  );
}

interface InventoryFootProps {
  cardCount: number;
  loyaltyCount: number;
  serviceCreditCount: number;
}

function InventoryFoot({ cardCount, loyaltyCount, serviceCreditCount }: InventoryFootProps): ReactElement {
  return (
    <button
      type="button"
      // Inventory expansion (E4-T7) deferred to S2. The footer is here
      // so the dashboard hierarchy is visibly complete — collapsed by
      // design, not by accident. Click is a no-op for now.
      onClick={() => undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--lo-space-4) var(--lo-space-6)',
        background: 'var(--lo-warm-white)',
        border: '1px solid var(--lo-hairline)',
        borderRadius: 'var(--lo-r-lg)',
        cursor: 'pointer',
        fontFamily: 'var(--lo-font-text)',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--lo-fs-body)' }}>
        <strong style={{ fontWeight: 600 }}>Inventory</strong>
        <span style={{ color: 'var(--lo-ink-faint)' }}>·</span>
        <span style={{ color: 'var(--lo-ink-muted)', fontFamily: 'var(--lo-font-mono)' }}>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </span>
        <span style={{ color: 'var(--lo-ink-faint)' }}>·</span>
        <span style={{ color: 'var(--lo-ink-muted)', fontFamily: 'var(--lo-font-mono)' }}>
          {loyaltyCount} status {loyaltyCount === 1 ? 'program' : 'programs'}
        </span>
        {serviceCreditCount > 0 && (
          <>
            <span style={{ color: 'var(--lo-ink-faint)' }}>·</span>
            <span style={{ color: 'var(--lo-ink-muted)', fontFamily: 'var(--lo-font-mono)' }}>
              {serviceCreditCount} service credit{serviceCreditCount === 1 ? '' : 's'}
            </span>
          </>
        )}
      </span>
      <span
        aria-hidden
        style={{ color: 'var(--lo-ink-muted)', fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-meta)', letterSpacing: 'var(--lo-tracking-label)', textTransform: 'uppercase' }}
      >
        expand · S2
      </span>
    </button>
  );
}

function DashboardLoading(): ReactElement {
  return (
    <div className="lo-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span className="lo-section-label">Loading context…</span>
    </div>
  );
}

function DashboardError({ message }: { message: string }): ReactElement {
  return (
    <div className="lo-content" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
      <span className="lo-section-label" style={{ color: 'var(--lo-red)' }}>
        Couldn&apos;t load your context
      </span>
      <p style={{ maxWidth: 560, color: 'var(--lo-ink-muted)' }}>{message}</p>
      <p style={{ fontSize: 'var(--lo-fs-meta)', color: 'var(--lo-ink-faint)', fontFamily: 'var(--lo-font-mono)' }}>
        Check ~/.personal-context.yaml against the schema.
      </p>
    </div>
  );
}

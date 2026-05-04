// E4-T3 — Landing screen (UC10).
//
// The launch artifact. Per spec eng+design review (both voices unanimous):
// "the side-by-side LLM transcript demo — this is the only thing only
// LifeOps can show, because no other app on the Mac App Store has both
// your wallet AND your LLM in the same frame." First screen on every
// launch until dismissed; thereafter accessible via top-bar tab.
//
// Composition (left → right):
//   1. "Without LifeOps" panel  — generic LLM answer, muted prose
//   2. "With LifeOps" panel     — same answer, brand-color highlights
//                                  on every fact pulled from YAML
//   3. Side rail YAML excerpt   — line-numbered, with matching colored
//                                  swatches in the gutter so the user
//                                  sees the data → answer linkage
//
// Highlight palette intentionally maps to the actual loyalty programs the
// transcript references (Hyatt = purple, Marriott = navy, Amex = green).
// This isn't decoration — it's the fact-to-source linkage made visible.

import type { ReactElement, ReactNode } from 'react';

interface Highlight {
  /** Unique key; matches the gutter swatch in the YAML rail. */
  id: string;
  /** CSS custom property name from lifeops-tokens.css. */
  colorVar: string;
  /** Visible label in the transcript. */
  text: string;
}

interface YamlLine {
  /** 1-indexed line number shown in the gutter. */
  n: number;
  /** Raw line content (kept narrow to fit the 320px rail). */
  raw: string;
  /** Highlight id this line is the source for, if any. */
  highlight?: string;
}

const HL = {
  hyatt:    { colorVar: '--lo-hyatt',    text: 'Hyatt Globalist' },
  hyattCert:{ colorVar: '--lo-hyatt',    text: 'Cat 1-7 free-night cert (expires Dec 31, 2026)' },
  parkHyatt:{ colorVar: '--lo-hyatt',    text: 'Park Hyatt Chicago' },
  marriott: { colorVar: '--lo-marriott', text: 'Marriott Titanium' },
  amexFhr:  { colorVar: '--lo-amex',     text: 'Amex Plat $200 hotel credit (FHR)' },
  inkind:   { colorVar: '--lo-grey-card',text: '$40 inKind credit at Avec' },
} as const satisfies Record<string, Omit<Highlight, 'id'>>;

const yamlExcerpt: readonly YamlLine[] = [
  { n: 1,  raw: 'loyalty:' },
  { n: 2,  raw: '  - program_id: hyatt',                         highlight: 'hyatt' },
  { n: 3,  raw: '    status: globalist' },
  { n: 4,  raw: '    points: 142000' },
  { n: 5,  raw: '    free_night_certs:',                         highlight: 'hyattCert' },
  { n: 6,  raw: '      - category_max: "Cat 1-7"' },
  { n: 7,  raw: '        expires_at: "2026-12-31"' },
  { n: 8,  raw: '        count: 1' },
  { n: 9,  raw: '  - program_id: marriott',                      highlight: 'marriott' },
  { n: 10, raw: '    status: titanium' },
  { n: 11, raw: '    points: 180000' },
  { n: 12, raw: '' },
  { n: 13, raw: 'cards:' },
  { n: 14, raw: '  - id: amex_platinum',                          highlight: 'amexFhr' },
  { n: 15, raw: '    issuer: amex' },
  { n: 16, raw: '    product: platinum' },
  { n: 17, raw: '' },
  { n: 18, raw: 'service_credits:' },
  { n: 19, raw: '  - id: inkind_balance',                         highlight: 'inkind' },
  { n: 20, raw: '    vendor: inkind' },
  { n: 21, raw: '    amount: 40' },
  { n: 22, raw: '    currency: USD' },
];

interface LandingProps {
  onDismiss: () => void;
}

export function Landing({ onDismiss }: LandingProps): ReactElement {
  return (
    <div className="lo-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-8)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--lo-space-8)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-3)', maxWidth: 760 }}>
          <span className="lo-section-label">Why this exists</span>
          <h1 style={{ fontSize: 'var(--lo-fs-headline)', fontWeight: 600, lineHeight: 1.05, letterSpacing: 'var(--lo-tracking-tight)', margin: 0 }}>
            This is what $1,000 a year looks like when your LLM knows your wallet.
          </h1>
          <p style={{ fontSize: 'var(--lo-fs-body)', color: 'var(--lo-ink-muted)', maxWidth: 720, margin: 0 }}>
            Same prompt. Two answers. The right-hand answer references your loyalty status,
            transferable points, and expiring credits — pulled live from a single local YAML
            file that lives on your Mac. No cloud. No scrapers. No bank logins.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss landing screen"
          className="lo-icon-btn"
          style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}
        >
          ×
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 320px)', gap: 'var(--lo-space-6)', flex: 1, minHeight: 0 }}>
        <TranscriptPanel
          tone="without"
          eyebrow="Without LifeOps"
          prompt="Plan a weekend in Chicago for me."
        >
          <p>
            Chicago's a great pick. Stay somewhere walkable to the Loop or River North.
            Try <Em>Avec</Em> or <Em>Girl &amp; the Goat</Em> for dinner — both are popular.
            The Art Institute and Millennium Park are easy day-of plans, and the lakefront
            is good for a morning run. For hotels, look at <Em>The Peninsula</Em>,
            <Em>The Langham</Em>, or any of the boutique places in Wicker Park.
          </p>
          <p>
            I'd budget around $400-700 a night for a nice room downtown depending on the
            weekend. Let me know if you want recommendations for a specific neighborhood.
          </p>
        </TranscriptPanel>

        <TranscriptPanel
          tone="with"
          eyebrow="With LifeOps"
          prompt="Plan a weekend in Chicago for me."
        >
          <p>
            For Chicago, <H id="parkHyatt">Park Hyatt Chicago</H> is a strong pick — your{' '}
            <H id="hyatt">Hyatt Globalist</H> status books suite upgrades when available, and
            you have a <H id="hyattCert">Cat 1-7 free-night cert (expires Dec 31, 2026)</H>{' '}
            — Park Hyatt Chicago is a Cat 7, so the cert covers it outright.
          </p>
          <p>
            For dinner at <strong>Avec</strong>, use your{' '}
            <H id="inkind">$40 inKind credit at Avec</H> — it's good through 2027.
            <strong> Peninsula Chicago</strong> is FHR-eligible, so your{' '}
            <H id="amexFhr">Amex Plat $200 hotel credit (FHR)</H> applies, plus 5×
            Membership Rewards on the booking.
          </p>
          <p>
            Backup option: your <H id="marriott">Marriott Titanium</H> gets suite-upgrade
            space-available at the Marriott Magnificent Mile if Hyatt fills up.
          </p>
        </TranscriptPanel>

        <YamlRail />
      </div>

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--lo-space-6)' }}>
        <p style={{ fontSize: 'var(--lo-fs-meta)', color: 'var(--lo-ink-muted)', margin: 0, fontFamily: 'var(--lo-font-mono)' }}>
          Local context source: ~/.personal-context.yaml · 6 facts referenced · zero network calls
        </p>
        <button type="button" onClick={onDismiss} className="lo-btn lo-btn--primary">
          See your dashboard  →
        </button>
      </footer>
    </div>
  );
}

interface TranscriptPanelProps {
  tone: 'without' | 'with';
  eyebrow: string;
  prompt: string;
  children: ReactNode;
}

function TranscriptPanel({ tone, eyebrow, prompt, children }: TranscriptPanelProps): ReactElement {
  const isWith = tone === 'with';
  return (
    <section
      style={{
        background: 'var(--lo-warm-white)',
        border: '1px solid var(--lo-hairline)',
        borderRadius: 'var(--lo-r-card)',
        boxShadow: isWith ? 'var(--lo-shadow-card)' : 'var(--lo-shadow-subtle)',
        padding: 'var(--lo-space-6) var(--lo-space-6) var(--lo-space-8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--lo-space-4)',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="lo-section-label">{eyebrow}</span>
        {isWith ? (
          <span style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-mini)', letterSpacing: 'var(--lo-tracking-label)', textTransform: 'uppercase', color: 'var(--lo-amex)' }}>
            ● local context
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-mini)', letterSpacing: 'var(--lo-tracking-label)', textTransform: 'uppercase', color: 'var(--lo-ink-faint)' }}>
            ○ no context
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-3)' }}>
        <span style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-meta)', color: 'var(--lo-ink-muted)', letterSpacing: 'var(--lo-tracking-wide)' }}>
          you
        </span>
        <p style={{ margin: 0, fontSize: 'var(--lo-fs-body)', color: 'var(--lo-ink)', fontStyle: 'italic' }}>
          “{prompt}”
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--lo-space-3)' }}>
        <span style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-meta)', color: 'var(--lo-ink-muted)', letterSpacing: 'var(--lo-tracking-wide)' }}>
          claude
        </span>
        <div
          style={{
            fontSize: 'var(--lo-fs-body)',
            color: isWith ? 'var(--lo-ink)' : 'var(--lo-ink-muted)',
            lineHeight: 1.65,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--lo-space-3)',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/** Em — generic emphasis used in the "without" panel where everything is unsourced.
 *  No color, no swatch, no link to the YAML rail — that's the whole point. */
function Em({ children }: { children: ReactNode }): ReactElement {
  return <span style={{ color: 'var(--lo-ink)', fontWeight: 500 }}>{children}</span>;
}

/** H — sourced highlight in the "with" panel. Coloured token + tiny swatch dot.
 *  Clicking would scroll the YAML rail to the line; not wired in W2. */
function H({ id, children }: { id: keyof typeof HL; children: ReactNode }): ReactElement {
  const meta = HL[id];
  const color = `var(${meta.colorVar})`;
  return (
    <span
      data-highlight={id}
      style={{
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        // bottom border (not background fill) keeps the prose readable while
        // still signaling "this is sourced from your YAML".
        borderBottom: `2px solid ${color}`,
        paddingBottom: 1,
      }}
    >
      {children}
    </span>
  );
}

function YamlRail(): ReactElement {
  return (
    <aside
      style={{
        background: 'var(--lo-warm-tint)',
        border: '1px solid var(--lo-hairline)',
        borderRadius: 'var(--lo-r-card)',
        padding: 'var(--lo-space-5) 0 var(--lo-space-5) var(--lo-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--lo-space-3)',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 'var(--lo-space-5)' }}>
        <span className="lo-section-label">~/.personal-context.yaml</span>
        <span style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-mini)', color: 'var(--lo-ink-faint)', letterSpacing: 'var(--lo-tracking-label)', textTransform: 'uppercase' }}>
          excerpt
        </span>
      </div>
      <div
        role="figure"
        aria-label="Excerpt of personal-context.yaml with sourced facts highlighted"
        style={{
          fontFamily: 'var(--lo-font-mono)',
          fontSize: 12,
          lineHeight: 1.7,
          color: 'var(--lo-ink)',
          overflowX: 'auto',
          paddingRight: 'var(--lo-space-5)',
        }}
      >
        {yamlExcerpt.map((line) => {
          const hl = line.highlight ? HL[line.highlight as keyof typeof HL] : undefined;
          const color = hl ? `var(${hl.colorVar})` : 'transparent';
          return (
            <div
              key={line.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '14px 28px 1fr',
                alignItems: 'center',
                columnGap: 8,
                background: hl ? 'rgba(15, 76, 58, 0.04)' : 'transparent',
                borderRadius: 4,
                paddingLeft: 4,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  justifySelf: 'center',
                }}
              />
              <span style={{ color: 'var(--lo-ink-faint)', textAlign: 'right' }}>{line.n}</span>
              <span style={{ whiteSpace: 'pre' }}>{line.raw || ' '}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

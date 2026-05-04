// E4-T5 — Onboarding wizard.
//
// Spec calls for "Welcome → ONE button 'See it work' → demo dashboard
// in <2 sec." For W2 that's a single ceremonial Welcome screen with
// one CTA. The benefit-pack picker the spec mentions is post-magic-
// moment and W3 work.
//
// Behaviour:
//   - First-ever launch only (localStorage flag `lifeops:onboarded`)
//   - "See it work →" sets onboarded + landing-dismissed and routes
//     straight to Dashboard, skipping Landing on the first launch
//     so the user hits demo data fast (<2s perceived)
//   - Landing remains accessible later via the top-bar tab
//
// Why not just use Landing as onboarding: Landing's load-bearing job is
// "remember why" (the showcase artifact). Forcing the very first user
// click to be on the Landing CTA conflates two roles. A discrete
// Welcome screen keeps Landing pure.

import type { ReactElement } from 'react';

interface OnboardingProps {
  onSeeItWork: () => void;
}

export function Onboarding({ onSeeItWork }: OnboardingProps): ReactElement {
  return (
    <div
      className="lo-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--lo-space-8)',
        textAlign: 'center',
      }}
    >
      <span className="lo-section-label">Welcome to LifeOps</span>
      <h1
        style={{
          fontSize: 'var(--lo-fs-headline)',
          fontWeight: 600,
          letterSpacing: 'var(--lo-tracking-tight)',
          margin: 0,
          maxWidth: 760,
          lineHeight: 1.05,
        }}
      >
        Your wallet, in context.
      </h1>
      <p
        style={{
          fontSize: 'var(--lo-fs-body)',
          color: 'var(--lo-ink-muted)',
          maxWidth: 560,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        One local YAML file on your Mac holds your loyalty status,
        transferable points, and expiring credits. No cloud, no scrapers,
        no bank logins. Your LLM gets the context — you don&apos;t forfeit
        the value.
      </p>
      <button
        type="button"
        onClick={onSeeItWork}
        className="lo-btn lo-btn--primary"
        style={{ fontSize: 14, padding: '14px 28px' }}
        autoFocus
      >
        See it work  →
      </button>
      <p
        style={{
          fontFamily: 'var(--lo-font-mono)',
          fontSize: 'var(--lo-fs-mini)',
          color: 'var(--lo-ink-faint)',
          letterSpacing: 'var(--lo-tracking-label)',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        opens a dashboard with demo data · &lt;2 seconds
      </p>
    </div>
  );
}

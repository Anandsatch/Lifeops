// Dashboard — placeholder for PR #1 (Track A). The real UC12 hero card +
// chip strip + collapsed inventory lands in PR #2 (Track B, E4-T4) once
// the Tauri context-read command + demo YAML are wired.
//
// This stub exists so dismissing Landing has a destination and the
// "Why this exists" tab has its sibling.

import type { ReactElement } from 'react';

export function Dashboard(): ReactElement {
  return (
    <div className="lo-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--lo-space-4)', textAlign: 'center' }}>
      <span className="lo-section-label">Dashboard</span>
      <h2 style={{ fontSize: 'var(--lo-fs-h1)', fontWeight: 600, margin: 0 }}>
        Hero card lands in the next PR.
      </h2>
      <p style={{ fontSize: 'var(--lo-fs-body)', color: 'var(--lo-ink-muted)', maxWidth: 480, margin: 0 }}>
        Track B (E4-T4 + T12 + T5) wires the Tauri context-read command,
        the example-amex-gold demo YAML, and the file-watching re-render
        loop — then this surface fills with your single most-expiring credit.
      </p>
      <p style={{ fontFamily: 'var(--lo-font-mono)', fontSize: 'var(--lo-fs-mini)', color: 'var(--lo-ink-faint)', letterSpacing: 'var(--lo-tracking-label)', textTransform: 'uppercase', margin: 0 }}>
        ◐ awaiting demo data
      </p>
    </div>
  );
}

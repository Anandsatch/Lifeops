// E4-T2 smoke check: prove design tokens + components load and render.
// Replaced with the real screen router in E4-T3 (Landing) + E4-T4 (Dashboard).
import type { ReactElement } from 'react';

export function App(): ReactElement {
  return (
    <div className="lo-window">
      <div className="lo-titlebar">
        <div className="lo-traffic">
          <span className="lo-tl lo-tl--red" />
          <span className="lo-tl lo-tl--yellow" />
          <span className="lo-tl lo-tl--green" />
        </div>
        <div className="lo-title">LifeOps</div>
        <div className="lo-title-actions" />
      </div>
      <div className="lo-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lo-hero" style={{ background: 'var(--lo-amex)' }}>
          <div className="lo-hero__label">E4-T2 · Design system imported</div>
          <div className="lo-hero__mid">
            <div className="lo-hero__countdown">
              W2<span className="lo-hero__small"> day 1</span>
            </div>
            <div className="lo-hero__progress">
              <div className="lo-hero__amt">
                <span className="lo-hero__currency">$</span>0
                <span className="lo-hero__of">of <strong>real data — wired in E4-T4</strong></span>
              </div>
              <div className="lo-bar"><div className="lo-bar__fill" style={{ width: '14%' }} /></div>
              <div className="lo-hero__hint">
                <span>tokens + components live</span><span>shadcn shim ready</span>
              </div>
            </div>
          </div>
          <div className="lo-hero__foot">
            <div>
              <div className="lo-hero__merchant">SPRINT 1 · WEEKEND 2</div>
              <div className="lo-hero__ledger">Landing screen lands next · view ledger →</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

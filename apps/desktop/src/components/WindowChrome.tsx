// Shared window chrome. Tauri's macOS titleBarStyle is set to "Overlay"
// (see tauri.conf.json) so the OS draws traffic lights + handles drag,
// but the title bar surface is transparent — we paint our own.
//
// The overlay traffic lights occupy ~80px on the left at the standard
// macOS button size. The top bar pads its left edge accordingly and
// declares `data-tauri-drag-region` on the bar background so the user
// can drag the window from any non-interactive part of the chrome.
//
// `.lo-window` from lifeops-components.css is intentionally NOT used
// here — it hard-codes 1440x900 for the design gallery mockup, where
// the chrome IS the demo. Inside a real Tauri window, the OS owns
// sizing; we fill the viewport instead.

import type { ReactElement, ReactNode } from 'react';
import type { Screen, ScreenController } from '../state/appState';

interface WindowChromeProps {
  controller: ScreenController;
  children: ReactNode;
}

interface Tab {
  id: Screen;
  label: string;
}

const TABS: readonly Tab[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'landing', label: 'Why this exists' },
];

// macOS traffic-light overlay reserves ~78px on the left when
// titleBarStyle: "Overlay" is set. Add a small breathing margin.
const TRAFFIC_LIGHT_INSET = 88;

export function WindowChrome({ controller, children }: WindowChromeProps): ReactElement {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--lo-desk)',
        color: 'var(--lo-ink)',
      }}
    >
      <div
        // Tauri 2 drag handle: any non-interactive region with this
        // attribute lets the user drag the window. Buttons stop the
        // drag automatically; no need to manually opt them out.
        data-tauri-drag-region
        style={{
          height: 44,
          background: 'var(--lo-titlebar)',
          borderBottom: '1px solid var(--lo-hairline)',
          display: 'grid',
          gridTemplateColumns: `${TRAFFIC_LIGHT_INSET}px 1fr auto`,
          alignItems: 'center',
          paddingRight: 16,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <div /> {/* traffic-light overlay zone (Tauri/macOS draws here) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'flex-start' }}>
          <span className="lo-title" style={{ fontSize: 13, fontWeight: 500, color: 'var(--lo-ink)', letterSpacing: '0.01em' }}>
            LifeOps
          </span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {TABS.map((tab) => {
              const active = controller.screen === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => controller.goto(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--lo-ink)' : 'var(--lo-ink-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--lo-font-text)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="lo-title-actions">
          {/* Settings gear, search, etc. land in later tickets. */}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// App-wide screen routing. Minimal hand-rolled state — react-router would be
// overkill for the W2 surface (Landing + Dashboard + later Onboarding).
//
// Persistence: `lifeops:landing-dismissed` lives in localStorage. Once true,
// future launches go straight to Dashboard; the user can still re-open
// Landing via the top-bar tab. Spec: "First screen on every launch until
// dismissed; then accessible via top-bar tab."

import { useState } from 'react';

export type Screen = 'landing' | 'dashboard';

const LANDING_DISMISSED_KEY = 'lifeops:landing-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(LANDING_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeDismissed(value: boolean): void {
  try {
    if (value) localStorage.setItem(LANDING_DISMISSED_KEY, 'true');
    else localStorage.removeItem(LANDING_DISMISSED_KEY);
  } catch {
    // localStorage may be unavailable in some Tauri contexts; degrade silently
    // (user just sees Landing every launch — acceptable).
  }
}

export interface ScreenController {
  screen: Screen;
  goto: (next: Screen) => void;
  dismissLanding: () => void;
}

export function useScreenController(): ScreenController {
  // Lazy initializer: read localStorage BEFORE the first render so a user
  // who already dismissed Landing sees Dashboard immediately — no
  // single-frame flash through Landing on every relaunch.
  const [screen, setScreen] = useState<Screen>(() =>
    readDismissed() ? 'dashboard' : 'landing',
  );

  return {
    screen,
    goto: setScreen,
    dismissLanding: () => {
      writeDismissed(true);
      setScreen('dashboard');
    },
  };
}

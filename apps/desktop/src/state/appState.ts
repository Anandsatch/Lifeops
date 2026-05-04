// App-wide screen routing. Minimal hand-rolled state — react-router would be
// overkill for the W2 surface (Landing + Dashboard + later Onboarding).
//
// Persistence: `lifeops:landing-dismissed` lives in localStorage. Once true,
// future launches go straight to Dashboard; the user can still re-open
// Landing via the top-bar tab. Spec: "First screen on every launch until
// dismissed; then accessible via top-bar tab."

import { useState } from 'react';

export type Screen = 'landing' | 'dashboard' | 'onboarding';

const LANDING_DISMISSED_KEY = 'lifeops:landing-dismissed';
const ONBOARDED_KEY = 'lifeops:onboarded';

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (value) localStorage.setItem(key, 'true');
    else localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable in some Tauri contexts; degrade silently.
  }
}

function initialScreen(): Screen {
  // Onboarding takes priority — first-ever launch should hit Welcome
  // before either Landing or Dashboard. Subsequent launches respect
  // the landing-dismissed flag.
  if (!readFlag(ONBOARDED_KEY)) return 'onboarding';
  if (readFlag(LANDING_DISMISSED_KEY)) return 'dashboard';
  return 'landing';
}

export interface ScreenController {
  screen: Screen;
  goto: (next: Screen) => void;
  dismissLanding: () => void;
  /** Onboarding "See it work" — sets onboarded + landing-dismissed and
   *  routes straight to Dashboard so the user sees demo data fast. */
  completeOnboarding: () => void;
}

export function useScreenController(): ScreenController {
  // Lazy initializer reads localStorage BEFORE the first render so an
  // already-onboarded user never flickers through the Onboarding or
  // Landing screen on relaunch.
  const [screen, setScreen] = useState<Screen>(initialScreen);

  return {
    screen,
    goto: setScreen,
    dismissLanding: () => {
      writeFlag(LANDING_DISMISSED_KEY, true);
      setScreen('dashboard');
    },
    completeOnboarding: () => {
      writeFlag(ONBOARDED_KEY, true);
      writeFlag(LANDING_DISMISSED_KEY, true);
      setScreen('dashboard');
    },
  };
}

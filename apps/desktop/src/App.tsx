// Root component. Routes between Landing (UC10) and Dashboard (UC12).
// Splash (E4-T6) is rendered at the HTML level outside React so it can
// paint before the JS bundle parses; this component takes over on mount.

import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useScreenController } from './state/appState';
import { WindowChrome } from './components/WindowChrome';
import { Landing } from './screens/Landing';
import { Dashboard } from './screens/Dashboard';
import { Onboarding } from './screens/Onboarding';

export function App(): ReactElement {
  const controller = useScreenController();

  // Tear down the pre-warmed splash as soon as React commits its first
  // paint. The splash element is plain HTML in index.html (E4-T6); we
  // remove rather than hide so it doesn't intercept any pointer events.
  useEffect(() => {
    const splash = document.getElementById('lo-splash');
    if (splash) splash.remove();
  }, []);

  return (
    <WindowChrome controller={controller}>
      {controller.screen === 'onboarding' && (
        <Onboarding onSeeItWork={controller.completeOnboarding} />
      )}
      {controller.screen === 'landing' && (
        <Landing onDismiss={controller.dismissLanding} />
      )}
      {controller.screen === 'dashboard' && <Dashboard />}
    </WindowChrome>
  );
}

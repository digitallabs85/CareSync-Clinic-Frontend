import { useState, useEffect } from "react";
import AppLoader from "./AppLoader"; // Your loader component

export default function SplashManager({ 
  isAppReady, 
  children 
}: { 
  isAppReady: boolean; 
  children: React.ReactNode;
}) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Start the mandatory 3-second countdown the moment the app boots
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Block the UI if the 3 seconds aren't up YET, OR if the app is STILL loading
  if (!minTimeElapsed || !isAppReady) {
    return <AppLoader />;
  }

  // Once both are true, render the actual app
  return <>{children}</>;
}
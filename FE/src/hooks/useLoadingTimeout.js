import { useEffect, useRef, useState } from "react";

// Flexible loading controller
// - delayMs: wait before showing spinner (prevents flicker)
// - capMs: optional maximum time to show spinner; null means no cap (true realtime)
// Returns { showSpinner, timedOut }
export default function useLoadingTimeout(loading, options = {}) {
  const { delayMs = 150, capMs = null } =
    typeof options === "number" ? { delayMs: 150, capMs: options } : options;

  const [delayPassed, setDelayPassed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const delayRef = useRef(null);
  const capRef = useRef(null);

  useEffect(() => {
    // Clear timers
    const clearAll = () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
      if (capRef.current) {
        clearTimeout(capRef.current);
        capRef.current = null;
      }
    };

    if (loading) {
      setDelayPassed(false);
      setTimedOut(false);
      clearAll();
      // start delay before showing spinner
      delayRef.current = setTimeout(() => setDelayPassed(true), Math.max(0, delayMs));
      // start cap timer if provided
      if (capMs != null) {
        capRef.current = setTimeout(() => setTimedOut(true), Math.max(0, capMs));
      }
    } else {
      setDelayPassed(false);
      setTimedOut(false);
      clearAll();
    }

    return clearAll;
  }, [loading, delayMs, capMs]);

  const showSpinner = Boolean(loading && (delayPassed || delayMs === 0) && (capMs == null || !timedOut));
  return { showSpinner, timedOut };
}

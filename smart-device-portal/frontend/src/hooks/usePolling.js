import { useEffect } from "react";
export default function usePolling(callback, intervalMs) {
  useEffect(() => {
    callback();
    const timer = setInterval(callback, intervalMs);
    return () => clearInterval(timer);
  }, [callback, intervalMs]);
}

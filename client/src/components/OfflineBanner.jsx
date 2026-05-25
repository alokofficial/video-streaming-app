import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(!navigator.onLine);

  useEffect(() => {
    let hideTimer;

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Hide the "Back Online" success message after 3 seconds
      hideTimer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    };

    const handleOffline = () => {
      if (hideTimer) clearTimeout(hideTimer);
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!showStatus) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center pointer-events-none p-4 transition-all duration-300">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md border animate-fade-in ${
          isOnline
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
            : "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? "animate-ping bg-emerald-400" : "animate-pulse bg-rose-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
        </span>
        <span>
          {isOnline
            ? "Back online! Syncing application."
            : "You are currently offline. Using cached data."}
        </span>
      </div>
    </div>
  );
}

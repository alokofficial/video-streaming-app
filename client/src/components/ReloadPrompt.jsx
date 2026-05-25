import { useRegisterSW } from "virtual:pwa-register/react";

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("Service Worker registered at:", swUrl);
    },
    onRegisterError(error) {
      console.error("Service Worker registration failed:", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 m-4 flex justify-center pointer-events-none sm:left-auto sm:m-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="pointer-events-auto flex max-w-md w-full flex-col gap-3 rounded-2xl border border-slate-200/50 bg-white/80 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400">
            {offlineReady ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5 animate-bounce"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {offlineReady ? "App Offline Ready" : "Update Available"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {offlineReady
                ? "The application has been cached and is ready to work offline."
                : "A new version of Flow Learn is available. Click reload to update."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          {needRefresh && (
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer"
            >
              Reload & Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

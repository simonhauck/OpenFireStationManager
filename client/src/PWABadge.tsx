import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function PWABadge() {
  // check for updates every hour
  const period = 60 * 60 * 1000;
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function close() {
    setNeedRefresh(false);
  }

  async function installApp() {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  }

  const hasToast = needRefresh || Boolean(installPromptEvent);

  return (
    <div
      style={{ position: "fixed", right: "1rem", bottom: "1rem", zIndex: 1000 }}
      role="alert"
      aria-labelledby="pwa-toast-message"
    >
      {hasToast && (
        <div
          style={{
            background: "#111",
            color: "#fff",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            display: "grid",
            gap: "0.5rem",
          }}
        >
          {needRefresh && (
            <div>
              <span id="pwa-toast-message">New content available.</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            {installPromptEvent && (
              <button onClick={installApp} style={{ cursor: "pointer" }}>
                Install app
              </button>
            )}
            {needRefresh && (
              <button onClick={() => updateServiceWorker(true)} style={{ cursor: "pointer" }}>
                Reload
              </button>
            )}
            {needRefresh && (
              <button onClick={() => close()} style={{ cursor: "pointer" }}>
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(period: number, swUrl: string, r: ServiceWorkerRegistration) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}

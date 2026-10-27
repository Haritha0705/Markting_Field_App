'use client';
import { useEffect, useState } from 'react';
import { InfoIcon } from '@/components/icons';

const INSTALL_DISMISSED_KEY = 'pgg_install_dismissed';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const recentlyDismissed = () => {
  try {
    return Date.now() - Number(localStorage.getItem(INSTALL_DISMISSED_KEY) || 0) < DISMISS_FOR_MS;
  } catch {
    return false;
  }
};

/** Mounted once in the root layout: registers the service worker and shows the
 *  install, update and offline banners. */
export function PwaInit() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [offline, setOffline] = useState(false);

  // Service worker (production only, so it never caches dev builds)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const next = reg.installing;
          next?.addEventListener('statechange', () => {
            // Only an update if a worker already controls the page (not first install)
            if (next.state === 'installed' && navigator.serviceWorker.controller) setWaiting(next);
          });
        });
        // Check for a new version when the officer comes back to the app
        const onVisible = () => document.visibilityState === 'visible' && reg.update().catch(() => {});
        document.addEventListener('visibilitychange', onVisible);
      })
      .catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  // Install prompt (Chrome / Edge / Android) and iOS "Add to Home Screen" hint
  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    if (ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) setShowIosHint(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Connection status
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const dismissInstall = () => {
    setInstallEvent(null);
    setShowIosHint(false);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {}
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
  };

  return (
    <>
      {offline && (
        <div className="pwa-offline" role="status" aria-live="polite">
          You&apos;re offline — changes can&apos;t be saved until you reconnect
        </div>
      )}

      {waiting ? (
        <div className="pwa-banner" role="status" aria-live="polite">
          <span style={{ display: 'flex', color: 'var(--green-700)' }}><InfoIcon size={17} /></span>
          <span style={{ flex: 1 }}>A new version of the app is available.</span>
          <button type="button" className="pwa-banner-action" onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}>
            Update
          </button>
        </div>
      ) : installEvent || showIosHint ? (
        <div className="pwa-banner" role="dialog" aria-label="Install app">
          <img src="/icons/icon-192.png" alt="" width={34} height={34} style={{ borderRadius: 9, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            {installEvent ? (
              'Install the PGG Field App on this device for quick access.'
            ) : (
              <>To install, tap <b>Share</b> then <b>Add to Home Screen</b>.</>
            )}
          </span>
          {installEvent && (
            <button type="button" className="pwa-banner-action" onClick={install}>Install</button>
          )}
          <button type="button" className="pwa-banner-close" onClick={dismissInstall} aria-label="Dismiss">✕</button>
        </div>
      ) : null}
    </>
  );
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface SnapCallbacks {
  onSuccess?: (result: any) => void;
  onPending?: (result: any) => void;
  onError?: (result: any) => void;
  onClose?: () => void;
}

const SNAP_SANDBOX_SCRIPT = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_PRODUCTION_SCRIPT = 'https://app.midtrans.com/snap/snap.js';

/**
 * Dynamically loads Midtrans Snap JS SDK if not already loaded.
 */
export function loadSnapScript(
  clientKey: string,
  isProduction = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.snap) {
      resolve(true);
      return;
    }

    const scriptUrl = isProduction ? SNAP_PRODUCTION_SCRIPT : SNAP_SANDBOX_SCRIPT;
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Snap] Failed to load Midtrans Snap script from', scriptUrl);
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Triggers the Snap Payment Modal popup with callback handlers.
 */
export function openSnapPayment(token: string, callbacks?: SnapCallbacks): void {
  if (typeof window === 'undefined' || !window.snap) {
    console.warn('[Snap] window.snap is not available.');
    callbacks?.onError?.({ message: 'Midtrans Snap is not loaded' });
    return;
  }

  window.snap.pay(token, {
    onSuccess: callbacks?.onSuccess,
    onPending: callbacks?.onPending,
    onError: callbacks?.onError,
    onClose: callbacks?.onClose,
  });
}

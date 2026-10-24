import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSnapScript, openSnapPayment } from './snapClient';

describe('snapClient', () => {
  const dummyClientKey = 'SB-Mid-client-TESTKEY123';

  beforeEach(() => {
    // Clear scripts and window.snap
    document.querySelectorAll('script[src*="snap.js"]').forEach((el) => el.remove());
    delete (window as unknown as { snap?: unknown }).snap;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('MDT-CLIENT-001: should inject snap.js script tag into DOM with correct client-key', async () => {
    const promise = loadSnapScript(dummyClientKey, false);

    const script = document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('data-client-key')).toBe(dummyClientKey);

    // Simulate script onload
    (window as unknown as { snap?: object }).snap = { pay: vi.fn() };
    script?.dispatchEvent(new Event('load'));

    const loaded = await promise;
    expect(loaded).toBe(true);
  });

  it('MDT-CLIENT-002: should not inject duplicate script if already present', async () => {
    (window as unknown as { snap?: object }).snap = { pay: vi.fn() };
    const loaded = await loadSnapScript(dummyClientKey, false);

    expect(loaded).toBe(true);
    const scripts = document.querySelectorAll('script[src*="snap.js"]');
    expect(scripts.length).toBe(0); // did not append because already loaded
  });

  it('MDT-CLIENT-003: openSnapPayment should call window.snap.pay with callbacks', () => {
    const mockPay = vi.fn();
    (window as unknown as { snap?: object }).snap = { pay: mockPay };

    const callbacks = {
      onSuccess: vi.fn(),
      onPending: vi.fn(),
      onError: vi.fn(),
      onClose: vi.fn(),
    };

    openSnapPayment('snap-token-xyz', callbacks);

    expect(mockPay).toHaveBeenCalledWith('snap-token-xyz', expect.objectContaining({
      onSuccess: callbacks.onSuccess,
      onPending: callbacks.onPending,
      onError: callbacks.onError,
      onClose: callbacks.onClose,
    }));
  });
});

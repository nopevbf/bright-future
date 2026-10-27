/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthTransitionOverlay } from '../components/AuthTransitionOverlay';

describe('AuthTransitionOverlay Component (Interactive UI & Animation Delay)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('TC-TRN-001: Renders login transition with role badge, interactive status message, and spinner', () => {
    const onCompleteMock = vi.fn();

    render(
      <AuthTransitionOverlay
        mode="login"
        role="admin"
        userName="Super Admin"
        durationMs={1000}
        onComplete={onCompleteMock}
      />
    );

    // Should display interactive login header
    expect(screen.getByText(/Menyiapkan Sesi Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Super Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin & Owner/i)).toBeInTheDocument();

    // Callback should not be called yet
    expect(onCompleteMock).not.toHaveBeenCalled();

    // Advance timer past duration
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Callback is triggered after delay
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('TC-TRN-002: Renders logout transition with secure cleanup status and executes after delay', () => {
    const onCompleteMock = vi.fn();

    render(
      <AuthTransitionOverlay
        mode="logout"
        role="tutor"
        userName="Kak Anindya, S.Pd."
        durationMs={800}
        onComplete={onCompleteMock}
      />
    );

    expect(screen.getByText(/Mengakhiri Sesi/i)).toBeInTheDocument();
    expect(screen.getByText(/Kak Anindya, S.Pd./i)).toBeInTheDocument();
    expect(screen.getByText(/Membersihkan token sesi/i)).toBeInTheDocument();

    expect(onCompleteMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('TC-TRN-003: Progress bar advances smoothly during the transition delay', () => {
    render(
      <AuthTransitionOverlay
        mode="login"
        role="siswa"
        userName="Rayhan Kusuma"
        durationMs={1000}
        onComplete={vi.fn()}
      />
    );

    const progressBar = screen.getByTestId('auth-progress-bar');
    expect(progressBar).toBeInTheDocument();

    // Advance 50%
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Bar style should reflect progress
    expect(progressBar.style.width).not.toBe('0%');
  });
});

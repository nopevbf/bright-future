/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAINTENANCE_STORAGE_KEY = 'bf_maintenance_mode';
export const MAINTENANCE_TARGET_KEY = 'bf_maintenance_target_time';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * Checks whether the system is currently under maintenance mode.
 */
export function isMaintenanceActive(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return localStorage.getItem(MAINTENANCE_STORAGE_KEY) === 'true';
}

/**
 * Retrieves the target completion timestamp for maintenance mode.
 */
export function getMaintenanceTargetTimestamp(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  const raw = localStorage.getItem(MAINTENANCE_TARGET_KEY);
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Enables maintenance mode with a countdown duration (defaults to 7 days).
 */
export function enableMaintenanceMode(days: number = 7): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const targetTime = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, 'true');
  localStorage.setItem(MAINTENANCE_TARGET_KEY, targetTime.toString());
  // Dispatch a custom window event so open tabs/components can react immediately
  window.dispatchEvent(new Event('bf_maintenance_status_changed'));
}

/**
 * Disables maintenance mode and cleans storage keys.
 */
export function disableMaintenanceMode(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.removeItem(MAINTENANCE_STORAGE_KEY);
  localStorage.removeItem(MAINTENANCE_TARGET_KEY);
  window.dispatchEvent(new Event('bf_maintenance_status_changed'));
}

/**
 * Calculates remaining days, hours, minutes, and seconds until the target timestamp.
 */
export function calculateTimeRemaining(
  targetTimestamp: number,
  currentTimestamp: number = Date.now()
): TimeRemaining {
  const diff = targetTimestamp - currentTimestamp;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  const seconds = Math.floor((diff % minute) / second);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

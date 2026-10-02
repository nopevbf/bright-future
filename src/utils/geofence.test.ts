import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, validateGeofencePresence, Coordinates } from './geofence';

describe('Geofence GPS Haversine (< 25m) (REQ-02)', () => {
  // Contoh titik GPS di Magelang (kediaman murid di Mertoyudan)
  const homeCoords: Coordinates = {
    latitude: -7.502931,
    longitude: 110.218492,
  };

  it('menghitung jarak 0 meter ketika tutor berada persis di titik rumah murid', () => {
    const distance = calculateHaversineDistance(homeCoords, homeCoords);
    expect(distance).toBeCloseTo(0, 1);

    const validation = validateGeofencePresence(homeCoords, homeCoords);
    expect(validation.isWithinGeofence).toBe(true);
    expect(validation.distanceMeters).toBeLessThan(25);
  });

  it('memvalidasi kehadiran jika tutor berada dalam radius < 25 meter (misal ~15 meter)', () => {
    // Geser sedikit latitude (0.000135 derajat latitude ~ 15 meter)
    const tutorCoords: Coordinates = {
      latitude: homeCoords.latitude + 0.000135,
      longitude: homeCoords.longitude,
    };

    const validation = validateGeofencePresence(tutorCoords, homeCoords);
    expect(validation.distanceMeters).toBeGreaterThan(10);
    expect(validation.distanceMeters).toBeLessThan(25);
    expect(validation.isWithinGeofence).toBe(true);
  });

  it('menolak kehadiran jika tutor berada di luar batas toleransi >= 25 meter (BVA: 25.1m - 35m)', () => {
    // Geser latitude 0.0003 derajat (~33 meter)
    const outsideCoords: Coordinates = {
      latitude: homeCoords.latitude + 0.0003,
      longitude: homeCoords.longitude,
    };

    const validation = validateGeofencePresence(outsideCoords, homeCoords);
    expect(validation.distanceMeters).toBeGreaterThanOrEqual(25);
    expect(validation.isWithinGeofence).toBe(false);
    expect(validation.statusMessage).toContain('di luar radius');
  });

  it('menolak kehadiran jika tutor berada jauh (misal 500 meter di pusat kota)', () => {
    const farCoords: Coordinates = {
      latitude: -7.480000,
      longitude: 110.220000,
    };

    const validation = validateGeofencePresence(farCoords, homeCoords);
    expect(validation.isWithinGeofence).toBe(false);
    expect(validation.distanceMeters).toBeGreaterThan(1000);
  });

  it('menangani input koordinat yang tidak valid atau out of bounds', () => {
    const invalidCoords: Coordinates = {
      latitude: 199, // out of range
      longitude: 110.218492,
    };

    const validation = validateGeofencePresence(invalidCoords, homeCoords);
    expect(validation.isWithinGeofence).toBe(false);
    expect(validation.distanceMeters).toBe(Infinity);
  });
});

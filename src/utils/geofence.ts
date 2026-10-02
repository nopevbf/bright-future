export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceValidationResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  maxRadiusMeters: number;
  statusMessage: string;
}

export const MAX_GEOFENCE_RADIUS_METERS = 25;
const EARTH_RADIUS_METERS = 6371000; // Radius rata-rata bumi dalam meter

/**
 * Validasi apakah koordinat berada dalam rentang wajar latitude [-90, 90] & longitude [-180, 180].
 */
export function isValidCoordinate(coord?: Coordinates | null): boolean {
  if (!coord) return false;
  const { latitude, longitude } = coord;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Menghitung jarak geodesic antara dua titik koordinat bumi menggunakan rumus Haversine.
 * Hasil dalam satuan meter.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  if (!isValidCoordinate(coord1) || !isValidCoordinate(coord2)) {
    return Infinity;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;

  const lat1 = toRad(coord1.latitude);
  const lon1 = toRad(coord1.longitude);
  const lat2 = toRad(coord2.latitude);
  const lon2 = toRad(coord2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Memvalidasi apakah posisi tutor berada di dalam radius toleransi geofence rumah murid (< 25 meter).
 */
export function validateGeofencePresence(
  currentTutorCoords: Coordinates,
  targetHomeCoords: Coordinates,
  maxRadius: number = MAX_GEOFENCE_RADIUS_METERS
): GeofenceValidationResult {
  const distanceMeters = calculateHaversineDistance(currentTutorCoords, targetHomeCoords);

  if (distanceMeters === Infinity) {
    return {
      isWithinGeofence: false,
      distanceMeters: Infinity,
      maxRadiusMeters: maxRadius,
      statusMessage: 'Koordinat GPS tidak valid. Pastikan izin lokasi aktif.',
    };
  }

  const isWithin = distanceMeters < maxRadius;

  return {
    isWithinGeofence: isWithin,
    distanceMeters: Math.round(distanceMeters * 10) / 10,
    maxRadiusMeters: maxRadius,
    statusMessage: isWithin
      ? `Tervalidasi di lokasi meja belajar murid (${Math.round(distanceMeters)}m dari titik rumah).`
      : `Presensi gagal: Tutor berada di luar radius geofence (< 25m). Jarak saat ini: ${Math.round(distanceMeters)}m.`,
  };
}

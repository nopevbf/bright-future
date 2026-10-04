import { Coordinates } from './geofence';

/**
 * Centroid koordinat geolokasi presisi (Latitude, Longitude) untuk seluruh kecamatan
 * di Kabupaten dan Kota Magelang, Jawa Tengah.
 * Digunakan untuk kalkulasi jarak geodesic (Haversine) penugasan tutor les privat.
 */
export const MAGELANG_DISTRICT_COORDINATES: Record<string, Coordinates> = {
  // Kota Magelang
  'magelang utara': { latitude: -7.4589, longitude: 110.2223 },
  'magelang tengah': { latitude: -7.4792, longitude: 110.2178 },
  'magelang selatan': { latitude: -7.5015, longitude: 110.2241 },

  // Kabupaten Magelang (Pusat & Aglomerasi)
  'mertoyudan': { latitude: -7.5218, longitude: 110.2281 },
  'mungkid': { latitude: -7.5756, longitude: 110.2452 }, // Kawasan Pemkab / Kota Mungkid
  'secang': { latitude: -7.3985, longitude: 110.2526 },
  'muntilan': { latitude: -7.5833, longitude: 110.3012 },
  'borobudur': { latitude: -7.6078, longitude: 110.2038 },
  'tegalrejo': { latitude: -7.4682, longitude: 110.2831 },
  'salaman': { latitude: -7.5841, longitude: 110.1345 },
  'grabag': { latitude: -7.3654, longitude: 110.3341 },
  'tempuran': { latitude: -7.5342, longitude: 110.1654 },
  'sawangan': { latitude: -7.5412, longitude: 110.3542 },
  'candimulyo': { latitude: -7.4891, longitude: 110.2891 },
  'bandongan': { latitude: -7.4721, longitude: 110.1782 },
  'windusari': { latitude: -7.4082, longitude: 110.1581 },
  'kaliangkrik': { latitude: -7.4612, longitude: 110.0892 },
  'salam': { latitude: -7.6321, longitude: 110.3121 },
  'srumbung': { latitude: -7.5982, longitude: 110.3421 },
  'dukun': { latitude: -7.5431, longitude: 110.3312 },
  'ngluwar': { latitude: -7.6621, longitude: 110.2812 },
  'pakis': { latitude: -7.4489, longitude: 110.3621 },
  'ngablak': { latitude: -7.3912, longitude: 110.4012 },
};

/**
 * Koordinat default bila kecamatan belum terpetakan (Alun-Alun / Titik Nol Magelang).
 */
export const DEFAULT_MAGELANG_CENTER: Coordinates = {
  latitude: -7.4792,
  longitude: 110.2178,
};

/**
 * Menemukan koordinat kecamatan terdekat berdasarkan nama kecamatan (case-insensitive & pembersihan string).
 */
export function getDistrictCoordinates(districtName?: string | null): Coordinates {
  if (!districtName) return DEFAULT_MAGELANG_CENTER;

  const normalized = districtName
    .toLowerCase()
    .replace(/^kec(amatan)?\.?\s*/i, '')
    .replace(/,\s*(kab|kota)?\s*magelang.*$/i, '')
    .trim();

  // Pencarian tepat
  if (MAGELANG_DISTRICT_COORDINATES[normalized]) {
    return MAGELANG_DISTRICT_COORDINATES[normalized];
  }

  // Pencarian parsial
  for (const [key, coords] of Object.entries(MAGELANG_DISTRICT_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return DEFAULT_MAGELANG_CENTER;
}

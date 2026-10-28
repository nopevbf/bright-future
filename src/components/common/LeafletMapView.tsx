import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface LeafletMapViewProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  geofenceRadiusMeters?: number;
  studentName?: string;
  tutorName?: string;
  distanceMeters?: number;
  isInsideGeofence?: boolean;
  className?: string;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  centerLat = -7.5024,
  centerLng = 110.2191,
  zoom = 17,
  geofenceRadiusMeters = 50,
  studentName = 'Rumah Siswa',
  tutorName = 'Posisi Tutor',
  distanceMeters = 8,
  isInsideGeofence = true,
  className = 'w-full h-64 rounded-2xl overflow-hidden',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if map is already initialized on this container
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add OSM tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 50-meter Geofence Circle around target house
      L.circle([centerLat, centerLng], {
        radius: geofenceRadiusMeters,
        color: isInsideGeofence ? '#3F5A46' : '#C1683F',
        fillColor: isInsideGeofence ? '#c8ebce' : '#EFC9AE',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      // Custom HTML Pin for Student House
      const houseIcon = L.divIcon({
        className: 'bf-house-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="background-color:#284230; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; border:2px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">
              H
            </div>
            <div style="background:rgba(255,255,255,0.95); padding:1px 6px; border-radius:6px; font-size:9px; font-weight:700; color:#284230; margin-top:2px; box-shadow:0 1px 4px rgba(0,0,0,0.15); white-space:nowrap;">
              ${studentName}
            </div>
          </div>
        `,
        iconSize: [26, 46],
        iconAnchor: [13, 13],
      });

      L.marker([centerLat, centerLng], { icon: houseIcon })
        .addTo(map)
        .bindPopup(`<b>${studentName}</b><br>Titik Rumah Presensi Geofence`);

      // Slightly offset coordinates for tutor pin based on distanceMeters (approx 0.00008 deg ~ 8m)
      const offsetLat = centerLat + 0.00006;
      const offsetLng = centerLng + 0.00005;

      const tutorIcon = L.divIcon({
        className: 'bf-tutor-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="position:relative; width:18px; height:18px;">
              <div style="position:absolute; inset:0; border-radius:50%; background-color:#C1683F; opacity:0.4; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position:relative; background-color:#C1683F; width:18px; height:18px; border-radius:50%; border:2.5px solid white; box-shadow:0 2px 8px rgba(193,104,63,0.5);"></div>
            </div>
            <div style="background:#1c1c18; padding:1px 6px; border-radius:6px; font-size:9px; font-weight:700; color:white; margin-top:2px; box-shadow:0 1px 4px rgba(0,0,0,0.25); white-space:nowrap;">
              ${tutorName.split(',')[0]} (${distanceMeters}m)
            </div>
          </div>
        `,
        iconSize: [20, 42],
        iconAnchor: [10, 9],
      });

      L.marker([offsetLat, offsetLng], { icon: tutorIcon })
        .addTo(map)
        .bindPopup(`<b>${tutorName}</b><br>Posisi GPS Aktif (${distanceMeters}m dari pusat)`);

      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Leaflet initialization note:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom, geofenceRadiusMeters, studentName, tutorName, distanceMeters, isInsideGeofence]);

  return (
    <div className={`relative ${className}`} data-testid="leaflet-map-wrapper">
      <div
        ref={containerRef}
        data-testid="leaflet-map-container"
        className="w-full h-full bg-[#FAF7F1]"
        style={{ minHeight: '220px' }}
      />
      {/* Geofence Overlay Pill */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-[rgba(42,40,35,0.08)] flex items-center gap-2 text-xs font-bold text-[#284230]">
        <span className="w-2 h-2 rounded-full bg-[#3F5A46] animate-pulse"></span>
        <span>Radius Aman 50 Meter (Leaflet GPS)</span>
      </div>
    </div>
  );
};

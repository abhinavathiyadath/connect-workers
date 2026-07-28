import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/** Accent marker (#FF4D2D) — divIcon avoids Vite asset path issues with default Leaflet icons */
function useOrangeIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: 'cw-marker-pin',
        html:
          '<div style="width:28px;height:28px;background:#FF4D2D;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.5)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    []
  );
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/** Keeps map centered when position is loaded from storage */
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom() || 13, { animate: true });
  }, [position, map]);
  return null;
}

/**
 * Dark basemap (Carto) + orange marker. Click map to move marker.
 */
export default function LocationMap({ position, onPositionChange }) {
  const icon = useOrangeIcon();

  return (
    <div className="cw-map-shell cw-marker-wrap" style={{ height: 340, width: '100%' }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Recenter position={position} />
        <MapClickHandler onPick={onPositionChange} />
        <Marker position={position} icon={icon} />
      </MapContainer>
    </div>
  );
}

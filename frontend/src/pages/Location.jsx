import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationMap from '../components/LocationMap';

const STORAGE_KEY = 'customerLocation';

const DEFAULT = { lat: 12.9716, lng: 77.5946 };

/**
 * Customer picks location by clicking the map (lat/lng stored same as before).
 */
export default function Location() {
  const navigate = useNavigate();
  const [position, setPosition] = useState([DEFAULT.lat, DEFAULT.lng]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { lat: la, lng: ln } = JSON.parse(raw);
        if (la != null && ln != null && !Number.isNaN(+la) && !Number.isNaN(+ln)) {
          setPosition([+la, +ln]);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const save = (e) => {
    e.preventDefault();
    const [la, ln] = position;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: la, lng: ln }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goWorkers = () => {
    navigate('/customer/workers');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: 720 }}>
      <h1 className="page-title">Select your location</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
        Tap or click on the map to place the pin where you need a worker. Then save.
      </p>

      <LocationMap position={position} onPositionChange={setPosition} />

      <p
        style={{
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--muted)',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </p>

      <form onSubmit={save} className="card" style={{ marginTop: '1.25rem' }}>
        <button type="submit" className="btn btn-primary">
          Save location
        </button>
        {saved && (
          <span style={{ marginLeft: '1rem', color: 'var(--success)', fontSize: '0.9rem' }}>
            Saved!
          </span>
        )}
      </form>

      <p style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-outline" onClick={goWorkers}>
          Next: Find your worker →
        </button>
      </p>
    </div>
  );
}

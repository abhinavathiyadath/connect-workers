import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WorkerCard from '../components/WorkerCard';

const STORAGE_KEY = 'customerLocation';

export default function FindWorkers() {
  const [skill, setSkill] = useState('');
  const [village, setVillage] = useState('');
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setError('Please set your location first.');
      setWorkers([]);
      return;
    }
    let loc;
    try {
      loc = JSON.parse(raw);
    } catch {
      setError('Invalid saved location.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        lat: String(loc.lat),
        lng: String(loc.lng),
      });
      if (skill.trim()) params.set('skill', skill.trim());
      if (village.trim()) params.set('village', village.trim());
      const { data } = await api.get(`/workers/recommended?${params.toString()}`);
      setWorkers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load workers');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 className="page-title">Find your worker</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        Only <strong>approved</strong> workers are shown. Results are sorted by recommendation
        score (distance, price, rating, bookings).
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
            <label htmlFor="skill">Search by skill</label>
            <input
              id="skill"
              placeholder="e.g. plumbing, tailoring"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
            <label htmlFor="village">Filter by village / area</label>
            <input
              id="village"
              placeholder="Optional"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
          <Link to="/customer/location">Change location</Link>
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && workers.length === 0 && !error && (
        <p style={{ color: 'var(--muted)' }}>No workers match your filters yet.</p>
      )}

      <div className="grid-cards">
        {workers.map((w) => (
          <WorkerCard key={w._id} worker={w} />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import LocationMap from '../components/LocationMap.jsx';

const DEFAULT_MAP_POS = [12.9716, 77.5946];

export default function WorkerDashboard() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [mapPosition, setMapPosition] = useState(DEFAULT_MAP_POS);
  const [form, setForm] = useState({
    skill: '',
    village: '',
    price: '',
    // availabilitySlots are stored as an array of slot strings.
    slots: [],
  });
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const slotOptions = (() => {
    // 3-hour slots, but start time can be every hour in the range.
    // Example: 07:00–10:00, 08:00–11:00, ... , 19:00–22:00
    const startHour = 7;
    const endHour = 22;
    const slotLengthHours = 3;

    const slots = [];
    for (let h = startHour; h + slotLengthHours <= endHour; h += 1) {
      const start = `${String(h).padStart(2, '0')}:00`;
      const end = `${String(h + slotLengthHours).padStart(2, '0')}:00`;
      slots.push(`${start}–${end}`);
    }
    return slots;
  })();

  const gridSize = 16; // 4x4 cells
  const gridSlots = (() => {
    const slots = [...slotOptions];
    while (slots.length < gridSize) slots.push(null);
    return slots.slice(0, gridSize);
  })();

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/workers/profile/me');
      setProfile(data);
      setForm({
        skill: data.skill || '',
        village: data.village || '',
        price: data.price ?? '',
        slots: data.availabilitySlots || [],
      });
      if (data.location?.lat != null && data.location?.lng != null) {
        setMapPosition([Number(data.location.lat), Number(data.location.lng)]);
      } else {
        setMapPosition(DEFAULT_MAP_POS);
      }
    } catch {
      setProfile(null);
      setForm({
        skill: '',
        village: '',
        price: '',
        slots: [],
      });
      setMapPosition(DEFAULT_MAP_POS);
    }
  };

  const loadBookings = async () => {
    const { data } = await api.get('/bookings/worker');
    setBookings(data);
  };

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.put('/workers/profile', {
        skill: form.skill,
        village: form.village,
        location: { lat: mapPosition[0], lng: mapPosition[1] },
        price: parseFloat(form.price),
        availabilitySlots: form.slots,
      });
      setMsg('Profile saved. Wait for admin approval to appear in search.');
      loadProfile();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not save profile');
    }
  };

  const accept = async (id) => {
    await api.patch(`/bookings/${id}/accept`);
    loadBookings();
  };
  const reject = async (id) => {
    await api.patch(`/bookings/${id}/reject`);
    loadBookings();
  };
  const complete = async (id) => {
    await api.patch(`/bookings/${id}/complete`);
    loadBookings();
  };

  const pending = bookings.filter((b) => b.status === 'pending');
  const schedule = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className="btn"
      style={{
        background: tab === id ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
        color: tab === id ? '#fff' : 'var(--muted)',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: 8,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 className="page-title">Worker dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        Add your work profile, respond to booking requests, and track your schedule. You must be{' '}
        <strong>approved by admin</strong> before customers can find you.
      </p>

      {profile && (
        <p style={{ marginBottom: '1rem' }}>
          Status:{' '}
          <strong style={{ color: profile.isApproved ? 'var(--success)' : 'var(--accent)' }}>
            {profile.isApproved ? 'Approved' : 'Pending approval'}
          </strong>
          {' · '}
          Rating: ⭐ {profile.rating ?? 0} ({profile.totalRatings ?? 0} ratings) · Bookings done:{' '}
          {profile.totalBookings ?? 0}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {tabBtn('profile', 'Work profile')}
        {tabBtn('requests', `Requests (${pending.length})`)}
        {tabBtn('schedule', 'Schedule')}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="card" style={{ maxWidth: 720 }}>
          <div className="input-group">
            <label>Skill</label>
            <input
              value={form.skill}
              onChange={(e) => setForm({ ...form, skill: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Village / area name</label>
            <input
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '0.5rem' }}>
            <label>Your location</label>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0, marginBottom: '0.75rem' }}>
            Click or tap on the map to place where you usually work. Customers use this for distance
            in search.
          </p>
          <LocationMap position={mapPosition} onPositionChange={setMapPosition} />
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
          </p>

          <div className="input-group" style={{ marginTop: '1.25rem' }}>
            <label>Price (₹)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Availability slots</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '0.5rem',
                marginTop: '0.25rem',
                maxWidth: 520,
              }}
            >
              {gridSlots.map((s, idx) => {
                if (!s) {
                  return (
                    <div
                      // Placeholder to keep the grid 4x4.
                      key={`placeholder-${idx}`}
                      style={{
                        border: '1px solid transparent',
                        borderRadius: 10,
                        height: 46,
                        visibility: 'hidden',
                      }}
                    />
                  );
                }

                const checked = form.slots.includes(s);
                return (
                  <label
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: checked ? 'rgba(255,255,255,0.06)' : 'transparent',
                      cursor: 'pointer',
                      userSelect: 'none',
                      width: '100%',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          slots: nextChecked ? Array.from(new Set([...prev.slots, s])) : prev.slots.filter((x) => x !== s),
                        }));
                      }}
                    />
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', lineHeight: 1.1 }}>
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>
        </form>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.length === 0 && <p style={{ color: 'var(--muted)' }}>No pending requests.</p>}
          {pending.map((b) => (
            <div key={b._id} className="card">
              <strong>{b.customerId?.name}</strong>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {new Date(b.date).toLocaleDateString()} · {b.timeSlot}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => accept(b._id)}>
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => reject(b._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {schedule.length === 0 && (
            <p style={{ color: 'var(--muted)' }}>No confirmed or completed jobs yet.</p>
          )}
          {schedule.map((b) => (
            <div key={b._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <strong>{b.customerId?.name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {new Date(b.date).toLocaleDateString()} · {b.timeSlot}
                  </div>
                </div>
                <span className={`badge ${b.status === 'completed' ? 'badge-completed' : 'badge-confirmed'}`}>
                  {b.status}
                </span>
              </div>
              {b.status === 'confirmed' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => complete(b._id)}
                >
                  Mark completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

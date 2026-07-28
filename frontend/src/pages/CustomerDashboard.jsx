import { useState, useEffect } from 'react';
import api from '../services/api';

function statusClass(s) {
  if (s === 'pending') return 'badge-pending';
  if (s === 'confirmed') return 'badge-confirmed';
  if (s === 'completed') return 'badge-completed';
  return 'badge-rejected';
}

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [ratingFor, setRatingFor] = useState({});
  const [reviewFor, setReviewFor] = useState({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/bookings/customer');
    setBookings(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submitRating = async (bookingId) => {
    setMsg('');
    const rating = Number(ratingFor[bookingId]);
    if (!rating || rating < 1 || rating > 5) {
      setMsg('Please choose a rating 1–5.');
      return;
    }
    try {
      await api.post(`/bookings/${bookingId}/rate`, {
        rating,
        review: reviewFor[bookingId] || '',
      });
      setMsg('Thank you for your feedback!');
      setRatingFor((prev) => ({ ...prev, [bookingId]: '' }));
      setReviewFor((prev) => ({ ...prev, [bookingId]: '' }));
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not submit rating');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 className="page-title">My bookings</h1>
      {msg && <div className="alert alert-success">{msg}</div>}

      {bookings.length === 0 && (
        <p style={{ color: 'var(--muted)' }}>No bookings yet. Find a worker and request a slot.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bookings.map((b) => (
          <div key={b._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <strong>{b.workerId?.name || 'Worker'}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {new Date(b.date).toLocaleDateString()} · {b.timeSlot}
                </div>
              </div>
              <span className={`badge ${statusClass(b.status)}`}>{b.status}</span>
            </div>

            {b.status === 'completed' && b.rating == null && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Rate this service</p>
                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Stars (1–5)</label>
                  <select
                    value={ratingFor[b._id] || ''}
                    onChange={(e) =>
                      setRatingFor((prev) => ({ ...prev, [b._id]: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Review (optional)</label>
                  <textarea
                    rows={2}
                    value={reviewFor[b._id] || ''}
                    onChange={(e) =>
                      setReviewFor((prev) => ({ ...prev, [b._id]: e.target.value }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => submitRating(b._id)}
                >
                  Submit rating
                </button>
              </div>
            )}

            {b.status === 'completed' && b.rating != null && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem' }}>
                Your rating: ⭐ {b.rating}
                {b.review ? ` — “${b.review}”` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

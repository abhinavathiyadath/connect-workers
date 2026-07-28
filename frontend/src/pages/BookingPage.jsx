import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function BookingPage() {
  const { workerUserId } = useParams();
  const [worker, setWorker] = useState(null);
  const [date, setDate] = useState('');
  // Stored in normalized form to match backend comparisons.
  const [timeSlot, setTimeSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingBookedSlots, setLoadingBookedSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slotFetchError, setSlotFetchError] = useState('');

  const normalizeTimeSlot = (value) =>
    String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[–—-]/g, '–');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/workers/public/${workerUserId}`);
        setWorker(data);
      } catch {
        setError('Worker not found or not approved.');
      }
    };
    load();
  }, [workerUserId]);

  useEffect(() => {
    // When date changes, clear selection and fetch already-booked slots.
    setTimeSlot('');
    setSlotFetchError('');

    if (!date) {
      setBookedSlots([]);
      setSlotFetchError('');
      return;
    }

    let mounted = true;

    const loadBooked = async () => {
      try {
        if (!mounted) return;
        setLoadingBookedSlots(true);
        const { data } = await api.get('/bookings/booked-slots', {
          params: { workerUserId, date },
        });
        const nextBooked = data.bookedTimeSlots || [];
        setBookedSlots(nextBooked);
        // If the user had already selected a slot that became booked,
        // clear it so it's not submitted.
        setTimeSlot((prev) => {
          if (!prev) return prev;
          const prevNorm = normalizeTimeSlot(prev);
          const bookedNormSet = new Set((nextBooked || []).map(normalizeTimeSlot));
          return bookedNormSet.has(prevNorm) ? '' : prevNorm;
        });
        setSlotFetchError('');
      } catch {
        // If the user isn't logged in (or any fetch error), fall back to showing all slots.
        setBookedSlots([]);
        setSlotFetchError('Could not refresh booked slots right now.');
      } finally {
        if (mounted) setLoadingBookedSlots(false);
      }
    };

    loadBooked();

    // Poll so confirmed bookings disappear from the dropdown for other customers.
    const intervalId = window.setInterval(loadBooked, 10000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [workerUserId, date]);

  const selectableSlots = (() => {
    const workerSlots = worker?.availabilitySlots || [];
    const bookedSet = new Set((bookedSlots || []).map(normalizeTimeSlot));
    return workerSlots.filter((s) => !bookedSet.has(normalizeTimeSlot(s)));
  })();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/bookings', {
        workerUserId,
        date,
        timeSlot,
      });
      setSuccess('Booking request sent! The worker will accept or reject it.');
      setDate('');
      setTimeSlot('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create booking');
    }
  };

  if (!worker && !error) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        Loading…
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="alert alert-error">{error}</div>
        <Link to="/customer/workers">Back to workers</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: 480 }}>
      <h1 className="page-title">Book {worker.workerName}</h1>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p style={{ margin: 0 }}>
          <strong>Skill:</strong> {worker.skill} · <strong>Price:</strong> ₹{worker.price} ·{' '}
          <strong>Rating:</strong> ⭐ {worker.rating ?? '—'}
        </p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={submit} className="card">
        <div className="input-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="slot">Time slot</label>
          <select
            id="slot"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            required
            disabled={!worker || loadingBookedSlots}
          >
            <option value="" disabled>
              {loadingBookedSlots ? 'Loading...' : 'Select a time slot'}
            </option>
            {selectableSlots.map((s) => (
              <option key={normalizeTimeSlot(s)} value={normalizeTimeSlot(s)}>
                {s}
              </option>
            ))}
          </select>
          {date && !loadingBookedSlots && selectableSlots.length === 0 && (
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              All available slots are already booked for this date.
            </p>
          )}
          {slotFetchError && (
            <p style={{ margin: '0.5rem 0 0', color: 'var(--error)', fontSize: '0.85rem' }}>
              {slotFetchError}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          Request booking
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/customer/workers">← Back to list</Link>
      </p>
    </div>
  );
}

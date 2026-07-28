import { Link } from 'react-router-dom';

export default function WorkerCard({ worker }) {
  const slots = worker.availabilitySlots?.length
    ? worker.availabilitySlots.join(', ')
    : 'Contact for availability';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
            {worker.workerName || 'Worker'}
          </h3>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{worker.skill}</span>
        </div>
        <span
          style={{
            background: 'linear-gradient(135deg, #ff4d2d, #e63e22)',
            color: '#fff',
            padding: '0.25rem 0.5rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
          title="Recommendation score"
        >
          🔥 {worker.recommendationScore ?? '—'}
        </span>
      </div>
      <div style={{ fontSize: '0.9rem', display: 'grid', gap: '0.25rem' }}>
        <div>
          <strong>Price:</strong> ₹{worker.price}
        </div>
        <div>
          <strong>Rating:</strong> ⭐ {worker.rating?.toFixed?.(1) ?? worker.rating ?? '—'} (
          {worker.totalRatings ?? 0} reviews)
        </div>
        <div>
          <strong>Distance:</strong> 📍 {worker.distanceKm != null ? `${worker.distanceKm} km` : '—'}
        </div>
        <div>
          <strong>Village / area:</strong> {worker.village || '—'}
        </div>
        <div>
          <strong>Availability:</strong> {slots}
        </div>
      </div>
      <Link
        to={`/customer/book/${worker.userId}`}
        className="btn btn-primary"
        style={{ marginTop: '0.5rem', textAlign: 'center', textDecoration: 'none' }}
      >
        Book this worker
      </Link>
    </div>
  );
}

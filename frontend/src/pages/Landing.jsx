import { Link } from 'react-router-dom';

const heroStyle = {
  padding: '2.5rem 2rem',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-hero)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow)',
  textAlign: 'center',
  maxWidth: 720,
  margin: '0 auto 2.5rem',
};

export default function Landing() {
  return (
    <div className="container">
      <section style={heroStyle}>
        <h1
          style={{
            fontSize: '1.85rem',
            marginBottom: '0.75rem',
            lineHeight: 1.2,
            color: 'var(--text)',
          }}
        >
          Connect with <span className="brand-accent">Trusted Workers</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>
          Find trusted workers near you. Compare ratings, pricing, and book with ease.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-outline">
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </section>

      <section className="category-row" aria-label="Popular worker categories">
        <div className="category-card">
          <span className="cat-emoji" aria-hidden>
            ⚡
          </span>
          <h4>Electrician</h4>
          <p>Wiring, repairs &amp; installations</p>
        </div>
        <div className="category-card">
          <span className="cat-emoji" aria-hidden>
            🔧
          </span>
          <h4>Plumber</h4>
          <p>Pipes, leaks &amp; fittings</p>
        </div>
        <div className="category-card">
          <span className="cat-emoji" aria-hidden>
            🪚
          </span>
          <h4>Carpenter</h4>
          <p>Furniture &amp; woodwork</p>
        </div>
      </section>

      <section className="intro-cards-centered" aria-label="Who Connect Worker is for">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>For Customers</h3>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Search by skill, compare pricing, and book trusted workers easily.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>For Professionals</h3>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Create your profile, manage jobs, and grow with verified reviews.
          </p>
        </div>
      </section>
    </div>
  );
}

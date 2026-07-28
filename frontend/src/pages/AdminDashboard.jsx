import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { user: adminUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [section, setSection] = useState('analytics');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('customer');
  const [userMsg, setUserMsg] = useState('');
  const [userErr, setUserErr] = useState('');

  /**
   * Refresh dashboard data. Uses allSettled so one failed request (e.g. analytics)
   * does not prevent the user list and other sections from updating.
   */
  const loadAll = async () => {
    const results = await Promise.allSettled([
      api.get('/admin/analytics'),
      api.get('/admin/users'),
      api.get('/admin/workers/pending'),
      api.get('/admin/bookings'),
    ]);
    const [a, u, p, b] = results;
    if (a.status === 'fulfilled') setAnalytics(a.value.data);
    if (u.status === 'fulfilled') setUsers(u.value.data);
    if (p.status === 'fulfilled') setPending(p.value.data);
    if (b.status === 'fulfilled') setBookings(b.value.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const approve = async (id, approved) => {
    await api.patch(`/admin/workers/${id}/approval`, { approved });
    await loadAll();
  };

  const addUser = async (e) => {
    e.preventDefault();
    setUserMsg('');
    setUserErr('');
    try {
      await api.post('/admin/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUserMsg(`Added ${newRole}: ${newEmail}`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await loadAll();
    } catch (err) {
      setUserErr(err.response?.data?.message || 'Could not add user');
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Remove ${u.name} (${u.email})? This deletes their data and bookings.`)) {
      return;
    }
    setUserErr('');
    setUserMsg('');
    const id = String(u._id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUserMsg('User removed.');
      // Drop row immediately so the table never stays stale if another refresh request fails
      setUsers((prev) => prev.filter((row) => String(row._id) !== id));
      await loadAll();
    } catch (err) {
      setUserErr(err.response?.data?.message || 'Could not remove user');
      // Resync list if delete failed partway or UI was wrong
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data);
      } catch {
        /* ignore */
      }
    }
  };

  const canDelete = (u) =>
    u.role !== 'admin' && String(u._id) !== String(adminUser?._id);

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setSection(id)}
      className="btn"
      style={{
        background: section === id ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
        color: section === id ? '#fff' : 'var(--muted)',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: 8,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <h1 className="page-title">Admin dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        Default login: <code>admin@worker.com</code> / <code>admin123</code>
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {tabBtn('analytics', 'Analytics')}
        {tabBtn('workers', `Pending workers (${pending.length})`)}
        {tabBtn('users', 'All users')}
        {tabBtn('bookings', 'All bookings')}
      </div>

      {section === 'analytics' && analytics && (
        <div className="grid-cards" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Total users</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.totalUsers}</p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Total workers</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.totalWorkers}</p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Approved workers</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.approvedWorkers}</p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Total bookings</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.totalBookings}</p>
          </div>
        </div>
      )}

      {section === 'analytics' && analytics && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Most booked workers</h3>
            {analytics.mostBookedWorkers?.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>No data yet.</p>
            )}
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {analytics.mostBookedWorkers?.map((m) => (
                <li key={String(m.workerId)}>
                  {m.workerName} — {m.bookings} booking(s)
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Average rating per worker</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem' }}>Worker</th>
                    <th style={{ padding: '0.5rem' }}>Skill</th>
                    <th style={{ padding: '0.5rem' }}>Avg rating</th>
                    <th style={{ padding: '0.5rem' }}>Total ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.averageRatingPerWorker?.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem' }}>{row.workerName}</td>
                      <td style={{ padding: '0.5rem' }}>{row.skill}</td>
                      <td style={{ padding: '0.5rem' }}>⭐ {row.averageRating}</td>
                      <td style={{ padding: '0.5rem' }}>{row.totalRatings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {section === 'workers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.length === 0 && <p style={{ color: 'var(--muted)' }}>No pending profiles.</p>}
          {pending.map((w) => (
            <div key={w._id} className="card">
              <strong>{w.userId?.name}</strong> ({w.userId?.email})
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {w.skill} · ₹{w.price} · {w.village || '—'}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => approve(w._id, true)}>
                  Approve
                </button>
                <button type="button" className="btn btn-outline" onClick={() => approve(w._id, false)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'users' && (
        <>
          {userErr && <div className="alert alert-error">{userErr}</div>}
          {userMsg && <div className="alert alert-success">{userMsg}</div>}
          <form onSubmit={addUser} className="card" style={{ marginBottom: '1.25rem', maxWidth: 480 }}>
            <h3 style={{ marginTop: 0 }}>Add customer or worker</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
              Creates a login account. Workers can then fill their profile on the worker dashboard.
            </p>
            <div className="input-group">
              <label htmlFor="adm-name">Name</label>
              <input id="adm-name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="adm-email">Email</label>
              <input id="adm-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="adm-pass">Password</label>
              <input
                id="adm-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="input-group">
              <label htmlFor="adm-role">Role</label>
              <select id="adm-role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="customer">Customer</option>
                <option value="worker">Worker</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Add user
            </button>
          </form>

          <div className="card" style={{ overflowX: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>All users</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Role</th>
                  <th style={{ padding: '0.5rem' }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>{u.name}</td>
                    <td style={{ padding: '0.5rem' }}>{u.email}</td>
                    <td style={{ padding: '0.5rem' }}>{u.role}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {canDelete(u) ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => removeUser(u)}
                        >
                          Remove
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {section === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bookings.map((b) => (
            <div key={b._id} className="card" style={{ padding: '0.75rem 1rem' }}>
              <span className={`badge badge-${b.status === 'pending' ? 'pending' : b.status === 'confirmed' ? 'confirmed' : b.status === 'completed' ? 'completed' : 'rejected'}`}>
                {b.status}
              </span>{' '}
              <strong>{b.customerId?.name}</strong> → <strong>{b.workerId?.name}</strong>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {new Date(b.date).toLocaleDateString()} · {b.timeSlot}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

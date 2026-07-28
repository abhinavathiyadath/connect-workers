import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setItems(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const unread = items.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: '0.35rem 0.6rem', position: 'relative' }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
          if (!open) load();
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '0.65rem',
              minWidth: '1rem',
              height: '1rem',
              borderRadius: '50%',
              lineHeight: '1rem',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            width: 320,
            maxHeight: 360,
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            zIndex: 1100,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
            {items.some((n) => !n.isRead) && (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
                onClick={markAll}
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 && (
            <p style={{ padding: '1rem', margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              No notifications yet.
            </p>
          )}
          {items.map((n) => (
            <div
              key={n._id}
              style={{
                padding: '0.65rem 0.75rem',
                borderBottom: '1px solid var(--border)',
                background: n.isRead ? 'var(--surface)' : 'rgba(255, 77, 45, 0.08)',
                fontSize: '0.85rem',
              }}
            >
              <div>{n.message}</div>
              <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
                {!n.isRead && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => markRead(n._id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

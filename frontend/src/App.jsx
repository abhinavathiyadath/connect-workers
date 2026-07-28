import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Location from './pages/Location';
import FindWorkers from './pages/FindWorkers';
import BookingPage from './pages/BookingPage';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/customer/location"
            element={
              <ProtectedRoute roles={['customer']}>
                <Location />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/workers"
            element={
              <ProtectedRoute roles={['customer']}>
                <FindWorkers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book/:workerUserId"
            element={
              <ProtectedRoute roles={['customer']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute roles={['worker']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer
        style={{
          marginTop: '3rem',
          padding: '2.5rem 1.25rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="container" style={{ maxWidth: 560 }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Find trusted workers near you, anytime.
          </p>
          <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
            © 2026 Connect Worker
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import DashboardStats from '../../components/admin/analytics/DashboardStats';
import UserGrowthChart from '../../components/admin/analytics/UserGrowthChart';
import EventAttendanceChart from '../../components/admin/analytics/EventAttendanceChart';
import useLocalStorage from '../../hooks/useLocalStorage';
import '../../components/admin/analytics/analytics.css';

export default function AdminPage({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useLocalStorage('ns_admin_token', null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [data, setData] = useState({
    stats: null,
    growth: [],
    events: [],
  });

  const fetchAnalytics = async (authToken) => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const headers = { Authorization: `Bearer ${authToken}` };

      const [statsRes, growthRes, eventsRes] = await Promise.all([
        fetch(`${base}/api/admin/analytics/stats`, { headers }),
        fetch(`${base}/api/admin/analytics/growth`, { headers }),
        fetch(`${base}/api/admin/analytics/events`, { headers }),
      ]);

      if (statsRes.status === 401) {
        setToken(null);
        throw new Error('Session expired. Please login again.');
      }

      if (!statsRes.ok || !growthRes.ok || !eventsRes.ok) {
        throw new Error('Failed to fetch analytics data.');
      }

      const [stats, growth, events] = await Promise.all([
        statsRes.json(),
        growthRes.json(),
        eventsRes.json(),
      ]);

      setData({ stats, growth, events });
      setError(null);
    } catch (err) {
      setError(err.message);
      // Fallback for dev environment if token is present but API fails
      if (import.meta.env.DEV && authToken) {
        console.warn('Using fallback mock data for analytics');
        setData({
          stats: {
            totalUsers: 1240,
            activeRegistrations: 85,
            upcomingEvents: 3,
            conversionRate: '12.5%',
          },
          growth: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            registrations: Math.floor(Math.random() * 20) + i,
          })),
          events: [
            { name: 'KSS #153', capacity: 100, attendance: 92, waitlist: 15 },
            { name: 'AI Workshop', capacity: 60, attendance: 58, waitlist: 20 },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics(token);
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Login failed');
      setToken(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setData({ stats: null, growth: [], events: [] });
  };

  if (!token) {
    return (
      <div className="analytics-dashboard" style={{ maxWidth: 400, marginTop: '10vh' }}>
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
        <div className="chart-container" style={{ padding: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Login</h2>
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              type="text"
              placeholder="Username"
              aria-label="Username"
              className="input-field"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              className="input-field"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login to Dashboard'}
            </button>
          </form>
          {error && (
            <p
              style={{
                color: '#f87171',
                fontSize: '0.9rem',
                marginTop: '1rem',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <header
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <button onClick={onBack} className="btn-back">
            ← Back to Home
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
            Admin Analytics
          </h1>
          <p style={{ opacity: 0.7 }}>Visualizing platform growth and event performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            onClick={() => fetchAnalytics(token)}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className="btn btn-outline"
            onClick={handleLogout}
            style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          >
            Logout
          </button>
        </div>
      </header>

      {loading && <div className="loader-overlay">Loading...</div>}

      <DashboardStats stats={data.stats} />

      <div className="charts-grid">
        <UserGrowthChart data={data.growth} />
        <EventAttendanceChart data={data.events} />
      </div>
    </div>
  );
}

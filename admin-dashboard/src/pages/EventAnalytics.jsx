import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminIcon } from '../components/AdminIcon';
import { Skeleton } from '../components/Skeleton';

export function EventAnalytics() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.events
      .getAll()
      .then((data) => {
        if (data?.events) setEvents(data.events);
      })
      .catch(() => {});

    api.events
      .recommendations()
      .then((data) => setRecommendations(data))
      .catch((e) => setRecommendationsError(e.message))
      .finally(() => setRecommendationsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    api.eventRegistrations
      .analytics(selectedEventId)
      .then((data) => setAnalytics(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Event Analytics</h2>
      </div>

      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontFamily: 'Rajdhani,sans-serif', fontSize: '1.15rem' }}>
            <AdminIcon name="Sparkles" size={18} style={{ marginRight: 8 }} />
            Smart Recommendations
          </h3>
          {recommendations?.generatedAt && (
            <span style={{ color: 'var(--admin-text-muted, #888)', fontSize: '0.8rem' }}>
              Updated {new Date(recommendations.generatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {recommendationsLoading && <Skeleton height={96} count={2} />}
        {recommendationsError && <div className="page-error">{recommendationsError}</div>}

        {!recommendationsLoading && !recommendationsError && recommendations && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
                marginBottom: 16,
              }}
            >
              {(recommendations.recommendations || []).slice(0, 3).map((item) => (
                <div
                  key={`${item.title}-${item.action}`}
                  style={{
                    background: 'var(--admin-bg-card, #1a1a2e)',
                    border: '1px solid var(--admin-border, #333)',
                    borderRadius: 12,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <strong>{item.title}</strong>
                    <span
                      style={{
                        color: item.priority === 'high' ? '#22c55e' : '#f59e0b',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px', color: 'var(--admin-text, #eee)' }}>
                    {item.action}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--admin-text-muted, #888)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {(recommendations.attendancePredictions || []).slice(0, 3).map((prediction) => (
                <div
                  key={prediction.type}
                  style={{
                    background: 'var(--admin-bg-card, #1a1a2e)',
                    border: '1px solid var(--admin-border, #333)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <strong>{prediction.type}</strong>
                  <div style={{ marginTop: 8, color: '#3b82f6', fontWeight: 700 }}>
                    {prediction.predictedRegistrations} registrations predicted
                  </div>
                  <div style={{ color: 'var(--admin-text-muted, #888)', fontSize: '0.85rem' }}>
                    Capacity: {prediction.recommendedCapacity} | Confidence: {prediction.confidence}
                  </div>
                  {prediction.alert && (
                    <div style={{ marginTop: 8, color: '#f59e0b', fontSize: '0.85rem' }}>
                      {prediction.alert}
                    </div>
                  )}
                </div>
              ))}

              {(recommendations.schedulingRecommendations?.conflicts || []).slice(0, 2).map((c) => (
                <div
                  key={`${c.date}-${c.events.join('-')}`}
                  style={{
                    background: 'var(--admin-bg-card, #1a1a2e)',
                    border: '1px solid #f59e0b',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <strong>Scheduling conflict on {c.date}</strong>
                  <div style={{ marginTop: 8 }}>{c.events.join(' vs ')}</div>
                  <div style={{ color: 'var(--admin-text-muted, #888)', fontSize: '0.85rem' }}>
                    {c.explanation}
                  </div>
                </div>
              ))}
            </div>

            {recommendations.dataWindow?.note && (
              <p style={{ color: 'var(--admin-text-muted, #888)', fontSize: '0.85rem' }}>
                {recommendations.dataWindow.note}
              </p>
            )}
          </>
        )}
      </section>

      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-border, #333)',
            background: 'var(--admin-bg-card, #1a1a2e)',
            color: 'var(--admin-text, #eee)',
            width: 300,
          }}
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <Skeleton height={80} count={3} />}
      {error && <div className="page-error">{error}</div>}

      {analytics && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: 'Total Registrations',
                value: analytics.stats.total,
                icon: 'Users',
                color: '#3b82f6',
              },
              {
                label: 'Confirmed',
                value: analytics.stats.confirmed,
                icon: 'CheckCircle',
                color: '#22c55e',
              },
              {
                label: 'Waitlisted',
                value: analytics.stats.waitlisted,
                icon: 'Clock',
                color: '#f59e0b',
              },
              {
                label: 'Attended',
                value: analytics.stats.attended,
                icon: 'UserCheck',
                color: '#8b5cf6',
              },
              {
                label: 'Attendance Rate',
                value: `${analytics.attendanceRate}%`,
                icon: 'TrendingUp',
                color: '#ec4899',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'var(--admin-bg-card, #1a1a2e)',
                  border: '1px solid var(--admin-border, #333)',
                  borderRadius: 12,
                  padding: '20px 18px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--admin-text-muted, #888)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  <AdminIcon
                    name={stat.icon}
                    size={14}
                    style={{ marginRight: 6, color: stat.color }}
                  />
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: stat.color,
                    fontFamily: 'Orbitron,monospace',
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {analytics.departmentBreakdown.length > 0 && (
              <div
                style={{
                  background: 'var(--admin-bg-card, #1a1a2e)',
                  border: '1px solid var(--admin-border, #333)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <h3
                  style={{
                    margin: '0 0 14px',
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '1rem',
                  }}
                >
                  <AdminIcon name="BookOpen" size={16} style={{ marginRight: 8 }} />
                  By Department
                </h3>
                {analytics.departmentBreakdown.map((d) => (
                  <div
                    key={d.department}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--admin-border, #222)',
                    }}
                  >
                    <span>{d.department}</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            )}

            {analytics.yearBreakdown.length > 0 && (
              <div
                style={{
                  background: 'var(--admin-bg-card, #1a1a2e)',
                  border: '1px solid var(--admin-border, #333)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <h3
                  style={{
                    margin: '0 0 14px',
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '1rem',
                  }}
                >
                  <AdminIcon name="GraduationCap" size={16} style={{ marginRight: 8 }} />
                  By Year
                </h3>
                {analytics.yearBreakdown.map((y) => (
                  <div
                    key={y.year}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--admin-border, #222)',
                    }}
                  >
                    <span>{y.year} Year</span>
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>{y.count}</span>
                  </div>
                ))}
              </div>
            )}

            {analytics.waitlist.length > 0 && (
              <div
                style={{
                  background: 'var(--admin-bg-card, #1a1a2e)',
                  border: '1px solid var(--admin-border, #333)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <h3
                  style={{
                    margin: '0 0 14px',
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '1rem',
                  }}
                >
                  <AdminIcon name="Clock" size={16} style={{ marginRight: 8 }} />
                  Waitlist
                </h3>
                {analytics.waitlist.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--admin-border, #222)',
                    }}
                  >
                    <span>{w.full_name}</span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{w.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !error && !analytics && selectedEventId && (
        <div className="empty-state">No analytics data available for this event.</div>
      )}
    </div>
  );
}

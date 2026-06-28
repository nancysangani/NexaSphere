import React, { useState, useEffect, useCallback, useRef } from 'react';
import { buildUrl } from '../../utils/runtimeConfig';

const pageStyle = {
  minHeight: '100vh',
  background: '#0A0A0A',
  color: '#FFFFFF',
  padding: '24px',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const cardStyle = {
  background: '#1A1A1A',
  border: '1px solid #2A2A2A',
  borderRadius: '12px',
  padding: '20px',
};

const statCardStyle = (color) => ({
  ...cardStyle,
  borderLeft: `4px solid ${color}`,
});

const labelStyle = {
  fontSize: '13px',
  color: '#9CA3AF',
  marginBottom: '4px',
};

const valueStyle = (color = '#FFFFFF') => ({
  fontSize: '28px',
  fontWeight: 'bold',
  color,
});

const buttonStyle = (active = false) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  background: active ? '#CC1111' : '#2A2A2A',
  color: active ? 'white' : '#9CA3AF',
  transition: 'all 0.2s ease',
});

const statusBadge = (status) => {
  const colors = {
    operational: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', dot: '#10B981' },
    degraded: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#F59E0B' },
    down: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', dot: '#EF4444' },
    not_configured: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', dot: '#6B7280' },
    unknown: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', dot: '#6B7280' },
  };
  const c = colors[status] || colors.unknown;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    background: c.bg,
    color: c.text,
  };
};

const dotStyle = (color) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: color,
});

const progressBarStyle = (percent, color) => ({
  height: '8px',
  borderRadius: '4px',
  background: '#2A2A2A',
  overflow: 'hidden',
  marginTop: '8px',
});

const progressFillStyle = (percent, color) => ({
  height: '100%',
  width: `${Math.min(percent, 100)}%`,
  background: color,
  borderRadius: '4px',
  transition: 'width 0.3s ease',
});

const alertStyle = (severity) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '8px',
  background: severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
  border: `1px solid ${severity === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
  marginBottom: '8px',
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #2A2A2A',
  fontSize: '12px',
  fontWeight: '600',
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '13px',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getCpuColor(usage) {
  if (usage > 80) return '#EF4444';
  if (usage > 60) return '#F59E0B';
  return '#10B981';
}

function getMemoryColor(usage) {
  if (usage > 85) return '#EF4444';
  if (usage > 70) return '#F59E0B';
  return '#10B981';
}

export default function SystemHealthPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000);
  const [timeRange, setTimeRange] = useState('1h');
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(buildUrl('/api/health-dashboard/dashboard'));
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      setDashboardData(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Clear any existing interval before setting a new one — prevents
    // duplicate concurrent intervals if the effect re-runs (e.g. when
    // refreshInterval or fetchData changes) before the previous cleanup fires.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  if (loading && !dashboardData) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          Loading system health data...
        </div>
      </div>
    );
  }

  const { system, process: proc, services, alerts } = dashboardData || {};

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              System Health Monitor
            </h1>
            <p style={{ color: '#9CA3AF', margin: '4px 0 0 0', fontSize: '14px' }}>
              Real-time system performance and health metrics
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Auto-refresh:</span>
            <button onClick={() => setAutoRefresh(!autoRefresh)} style={buttonStyle(autoRefresh)}>
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #2A2A2A',
                background: '#1A1A1A',
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>60s</option>
            </select>
            <button onClick={fetchData} style={buttonStyle()}>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={alertStyle('critical')}>
            <span style={{ color: '#EF4444' }}>{error}</span>
          </div>
        )}

        {alerts && alerts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {alerts.map((alert) => (
              <div key={`${alert.severity}-${alert.message}`} style={alertStyle(alert.severity)}>
                <span style={{ fontSize: '16px' }}>
                  {alert.severity === 'critical' ? '🔴' : '🟡'}
                </span>
                <span style={{ color: alert.severity === 'critical' ? '#EF4444' : '#F59E0B' }}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* System Overview Cards */}
        {system && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={statCardStyle(getCpuColor(system.cpu.usage))}>
              <div style={labelStyle}>CPU Usage</div>
              <div style={valueStyle(getCpuColor(system.cpu.usage))}>{system.cpu.usage}%</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                {system.cpu.cores} cores • {system.cpu.model}
              </div>
              <div style={progressBarStyle()}>
                <div style={progressFillStyle(system.cpu.usage, getCpuColor(system.cpu.usage))} />
              </div>
            </div>

            <div style={statCardStyle(getMemoryColor(system.memory.usagePercent))}>
              <div style={labelStyle}>Memory Usage</div>
              <div style={valueStyle(getMemoryColor(system.memory.usagePercent))}>
                {system.memory.usagePercent}%
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                {formatBytes(system.memory.used)} / {formatBytes(system.memory.total)}
              </div>
              <div style={progressBarStyle()}>
                <div
                  style={progressFillStyle(
                    system.memory.usagePercent,
                    getMemoryColor(system.memory.usagePercent)
                  )}
                />
              </div>
            </div>

            <div style={statCardStyle('#3B82F6')}>
              <div style={labelStyle}>System Uptime</div>
              <div style={valueStyle('#3B82F6')}>{formatUptime(system.uptime)}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                Load: {system.loadAverage.map((l) => l.toFixed(2)).join(', ')}
              </div>
            </div>

            <div style={statCardStyle('#8B5CF6')}>
              <div style={labelStyle}>Process Memory</div>
              <div style={valueStyle('#8B5CF6')}>{formatBytes(proc?.memory?.heapUsed || 0)}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                Heap: {formatBytes(proc?.memory?.heapTotal || 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                RSS: {formatBytes(proc?.memory?.rss || 0)}
              </div>
            </div>
          </div>
        )}

        {/* CPU Per-Core */}
        {system && system.cpu.perCore && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              CPU Per-Core Usage
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px',
              }}
            >
              {system.cpu.perCore.map((usage, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                    Core {i}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: getCpuColor(usage) }}>
                    {usage}%
                  </div>
                  <div style={progressBarStyle()}>
                    <div style={progressFillStyle(usage, getCpuColor(usage))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Status */}
        {services && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Service Status</h3>
              <span style={statusBadge(services.overallStatus)}>
                <span
                  style={dotStyle(
                    services.overallStatus === 'healthy'
                      ? '#10B981'
                      : services.overallStatus === 'degraded'
                        ? '#F59E0B'
                        : '#EF4444'
                  )}
                />
                {services.overallStatus}
              </span>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {services.services.map((service) => (
                  <tr key={service.name}>
                    <td style={tdStyle}>{service.name}</td>
                    <td style={tdStyle}>
                      <span style={statusBadge(service.status)}>
                        <span
                          style={dotStyle(
                            service.status === 'operational'
                              ? '#10B981'
                              : service.status === 'degraded'
                                ? '#F59E0B'
                                : service.status === 'not_configured'
                                  ? '#6B7280'
                                  : '#EF4444'
                          )}
                        />
                        {service.status}
                      </span>
                    </td>
                    <td style={tdStyle}>{service.latency > 0 ? `${service.latency}ms` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Process Info */}
        {proc && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Process Information
              </h3>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdStyle}>PID</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{proc.pid}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Uptime</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{formatUptime(proc.uptime)}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Heap Used</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>
                      {formatBytes(proc.memory.heapUsed)}
                    </td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Heap Total</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>
                      {formatBytes(proc.memory.heapTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>RSS</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{formatBytes(proc.memory.rss)}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>External</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>
                      {formatBytes(proc.memory.external)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                System Information
              </h3>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdStyle}>Platform</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{system?.platform}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Architecture</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{system?.arch}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Hostname</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{system?.hostname}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Node.js Version</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>{proc?.versions?.node}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>V8 Version</td>
                    <td style={{ ...tdStyle, color: '#FFFFFF' }}>
                      {proc?.versions?.v8?.substring(0, 30)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['1h', '6h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={buttonStyle(timeRange === range)}
            >
              Last {range}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>
          Historical metrics and charts coming soon. Data refreshes every {refreshInterval / 1000}{' '}
          seconds.
        </div>
      </div>
    </div>
  );
}

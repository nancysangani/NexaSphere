import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient.js';
import DashboardStats from '../../components/admin/analytics/DashboardStats';
import UserGrowthChart from '../../components/admin/analytics/UserGrowthChart';
import EventAttendanceChart from '../../components/admin/analytics/EventAttendanceChart';
import '../../components/admin/analytics/analytics.css';
import socketClient from '../../utils/socketClient';
import { getApiBase } from '../../utils/runtimeConfig';

export default function AdminPage({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [data, setData] = useState({
    stats: null,
    growth: [],
    events: [],
  });

  // Tab & DR States
  const [activeTab, setActiveTab] = useState('analytics');
  const [tasks, setTasks] = useState([]);
  const [schedulerStats, setSchedulerStats] = useState(null);
  const [backups, setBackups] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [restoreLogs, setRestoreLogs] = useState([]);
  const [pitrTimestamp, setPitrTimestamp] = useState('');
  const [backupType, setBackupType] = useState('full');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const opts = { credentials: 'include' };

      const [stats, growth, events] = await Promise.all([
        apiClient(`${base}/api/admin/analytics/stats`, opts),
        apiClient(`${base}/api/admin/analytics/growth`, opts),
        apiClient(`${base}/api/admin/analytics/events`, opts),
      ]);

      setData({ stats, growth, events });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const opts = { credentials: 'include' };
      const res = await apiClient(`${base}/api/admin/scheduled-tasks`, opts);
      setTasks(res.tasks || []);
      setSchedulerStats(res.stats || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const opts = { credentials: 'include' };
      const [backupsRes, logsRes] = await Promise.all([
        apiClient(`${base}/api/admin/backups`, opts),
        apiClient(`${base}/api/admin/backups/restore-test-history`, opts),
      ]);
      setBackups(backupsRes.backups || []);
      setStorageStats(backupsRes.stats || null);
      setRestoreLogs(logsRes.history || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'analytics') fetchAnalytics();
      if (activeTab === 'tasks') fetchTasks();
      if (activeTab === 'backups') fetchBackups();
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const base = getApiBase();
    const url = `${base}/api/admin/metrics/stream`;

    const listeners = {};
    let closed = false;
    let reconnectTimeout = undefined;

    async function connect() {
      if (closed) return;
      try {
        const response = await fetch(url, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setIsLoggedIn(false);
            return;
          }
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let currentData = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '' && currentEvent && currentData) {
              const event = { data: currentData };
              (listeners[currentEvent] || []).forEach((fn) => fn(event));
              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[AdminPage] SSE metrics stream interrupted or reconnecting:', err.message);
        }
      }

      if (!closed) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    const sseClient = {
      addEventListener(event, fn) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
      },
      close() {
        closed = true;
        clearTimeout(reconnectTimeout);
      },
    };

    sseClient.addEventListener('registration', (event) => {
      try {
        JSON.parse(event.data);

        setData((prev) => {
          const currentStats = prev.stats || {
            totalUsers: null,
            activeRegistrations: null,
            upcomingEvents: null,
            conversionRate: null,
          };
          const nextStats = {
            ...currentStats,
            totalUsers: currentStats.totalUsers !== null ? currentStats.totalUsers + 1 : 1,
            activeRegistrations:
              currentStats.activeRegistrations !== null ? currentStats.activeRegistrations + 1 : 1,
          };

          const todayStr = new Date().toISOString().split('T')[0];
          const updatedGrowth = [...(prev.growth || [])];
          const todayIdx = updatedGrowth.findIndex((g) => g.date === todayStr);
          if (todayIdx >= 0) {
            updatedGrowth[todayIdx] = {
              ...updatedGrowth[todayIdx],
              registrations: (updatedGrowth[todayIdx].registrations || 0) + 1,
            };
          } else {
            updatedGrowth.push({ date: todayStr, registrations: 1 });
          }

          return {
            ...prev,
            stats: nextStats,
            growth: updatedGrowth,
          };
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AdminPage] Failed to parse registration SSE message:', err.message);
        }
      }
    });

    sseClient.addEventListener('login', (event) => {
      try {
        JSON.parse(event.data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AdminPage] Failed to parse login SSE message:', err.message);
        }
      }
    });

    connect();

    return () => {
      sseClient.close();
    };
  }, [isLoggedIn]);

  // Actions
  const handleToggleTask = async (taskId, currentEnabled) => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const base = getApiBase();
      await apiClient(`${base}/api/admin/scheduled-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
        credentials: 'include',
      });
      setActionMessage(
        `Task "${taskId}" ${!currentEnabled ? 'enabled' : 'disabled'} successfully.`
      );
      fetchTasks();
    } catch (err) {
      setActionMessage(`Failed to update task: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunTask = async (taskId) => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const base = getApiBase();
      await apiClient(`${base}/api/admin/scheduled-tasks/${taskId}/run`, {
        method: 'POST',
        credentials: 'include',
      });
      setActionMessage(`Task "${taskId}" triggered and executed successfully!`);
      fetchTasks();
    } catch (err) {
      setActionMessage(`Failed to execute task: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/backups/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: backupType }),
        credentials: 'include',
      });
      setActionMessage(`Backup completed successfully! Key: ${res.key}`);
      fetchBackups();
    } catch (err) {
      setActionMessage(`Backup failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backupKey) => {
    if (
      !window.confirm(
        `⚠️ WARNING: Are you sure you want to restore the database from backup: "${backupKey}"? This will overwrite active table contents.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/admin/backups/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupKey }),
        credentials: 'include',
      });
      setActionMessage(`Restore completed in ${res.result?.durationMs || 0}ms.`);
      fetchBackups();
    } catch (err) {
      setActionMessage(`Restore failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePITR = async () => {
    if (!pitrTimestamp) {
      alert('Please select a target date and time.');
      return;
    }
    if (
      !window.confirm(
        `⚠️ WARNING: Are you sure you want to perform Point-in-Time Recovery to target: "${pitrTimestamp}"?`
      )
    ) {
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      const base = getApiBase();
      await apiClient(`${base}/api/admin/backups/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTime: new Date(pitrTimestamp).toISOString() }),
        credentials: 'include',
      });
      setActionMessage(`Database successfully restored back to ${pitrTimestamp}.`);
      fetchBackups();
    } catch (err) {
      setActionMessage(`PITR failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBackup = async (key) => {
    if (!window.confirm(`Are you sure you want to delete backup file: "${key}"?`)) {
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      const base = getApiBase();
      await apiClient(`${base}/api/admin/backups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
        credentials: 'include',
      });
      setActionMessage(`Backup file deleted successfully.`);
      fetchBackups();
    } catch (err) {
      setActionMessage(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const base = getApiBase();
      await apiClient(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });

      setIsLoggedIn(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const base = getApiBase();
      await fetch(`${base}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AdminPage] Logout error:', err.message);
      }
    }
    setIsLoggedIn(false);
    setData({ stats: null, growth: [], events: [] });
    socketClient.destroySocket();
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  if (!isLoggedIn) {
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
              className="input-field"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
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
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <button onClick={onBack} className="btn-back">
            ← Back to Home
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
            NexaSphere Admin Dashboard
          </h1>
          <p style={{ opacity: 0.7 }}>
            Manage system schedulers, data integrity backups, and platform metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              if (activeTab === 'analytics') fetchAnalytics();
              if (activeTab === 'tasks') fetchTasks();
              if (activeTab === 'backups') fetchBackups();
            }}
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

      {/* Glassmorphic Navigation Tabs */}
      <div
        className="admin-tabs"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.4rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          maxWidth: 'fit-content',
        }}
      >
        <button
          onClick={() => {
            setActiveTab('analytics');
            setActionMessage('');
          }}
          style={{
            background: activeTab === 'analytics' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'analytics' ? '#60a5fa' : 'rgba(255, 255, 255, 0.7)',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => {
            setActiveTab('tasks');
            setActionMessage('');
          }}
          style={{
            background: activeTab === 'tasks' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'tasks' ? '#60a5fa' : 'rgba(255, 255, 255, 0.7)',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          Scheduled Tasks
        </button>
        <button
          onClick={() => {
            setActiveTab('backups');
            setActionMessage('');
          }}
          style={{
            background: activeTab === 'backups' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none',
            color: activeTab === 'backups' ? '#60a5fa' : 'rgba(255, 255, 255, 0.7)',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          Backup & Disaster Recovery
        </button>
      </div>

      {/* Global Action Message Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            background: actionMessage.toLowerCase().includes('failed')
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${actionMessage.toLowerCase().includes('failed') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            color: actionMessage.toLowerCase().includes('failed') ? '#fca5a5' : '#a7f3d0',
            marginBottom: '1.5rem',
            fontWeight: '500',
          }}
        >
          {actionMessage}
        </div>
      )}

      {loading && <div className="loader-overlay">Loading...</div>}
      {actionLoading && <div className="loader-overlay">Processing request...</div>}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <>
          <DashboardStats stats={data.stats} />
          <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
            <UserGrowthChart data={data.growth} />
            <EventAttendanceChart data={data.events} />
          </div>
        </>
      )}

      {/* Tab: Scheduled Tasks */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Bar */}
          {schedulerStats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}
                >
                  ⚡
                </div>
                <div>
                  <div className="stat-value">{schedulerStats.totalTasks}</div>
                  <div className="stat-label">Total Schedulers</div>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}
                >
                  ✓
                </div>
                <div>
                  <div className="stat-value">{schedulerStats.enabledTasks}</div>
                  <div className="stat-label">Active Schedulers</div>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}
                >
                  %
                </div>
                <div>
                  <div className="stat-value">{schedulerStats.successRate}%</div>
                  <div className="stat-label">Task Success Rate</div>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}
                >
                  🕒
                </div>
                <div>
                  <div className="stat-value">{schedulerStats.avgDurationMs}ms</div>
                  <div className="stat-label">Avg Execution Time</div>
                </div>
              </div>
            </div>
          )}

          {/* Schedulers Registry Table */}
          <div className="chart-container" style={{ width: '100%' }}>
            <div className="chart-header" style={{ marginBottom: '1.5rem' }}>
              <h2>Active System Tasks</h2>
              <p>
                Registry of back-end cron schedules, states, execution history counts, and triggers.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Task Details</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Cron</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Next Scheduled Run</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Last Run Stats</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}
                      >
                        No background tasks found.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.95rem',
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ display: 'block', color: '#fff' }}>{task.name}</strong>
                          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                            {task.description}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '0.25rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              background: 'rgba(255,255,255,0.06)',
                              opacity: 0.8,
                            }}
                          >
                            {task.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <code
                            style={{
                              background: 'rgba(0,0,0,0.2)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                            }}
                          >
                            {task.cron}
                          </code>
                        </td>
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                          {task.enabled ? (
                            formatDate(task.nextRun)
                          ) : (
                            <span style={{ color: '#ef4444' }}>Paused</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {task.lastRun ? (
                            <div>
                              <span
                                style={{
                                  color: task.lastStatus === 'success' ? '#34d399' : '#f87171',
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {task.lastStatus === 'success' ? 'SUCCESS' : 'FAILED'}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5 }}>
                                {task.lastDurationMs}ms ({formatDate(task.lastRun)})
                              </span>
                            </div>
                          ) : (
                            <span style={{ opacity: 0.4 }}>Never Executed</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              className={`btn ${task.enabled ? 'btn-outline' : 'btn-primary'}`}
                              onClick={() => handleToggleTask(task.id, task.enabled)}
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                borderColor: task.enabled
                                  ? 'rgba(245, 158, 11, 0.4)'
                                  : 'rgba(16, 185, 129, 0.4)',
                                color: task.enabled ? '#fbbf24' : '#34d399',
                                background: 'transparent',
                              }}
                            >
                              {task.enabled ? 'Pause' : 'Enable'}
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleRunTask(task.id)}
                              disabled={task.running}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              {task.running ? 'Running...' : 'Run Now'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Recovery */}
      {activeTab === 'backups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Storage & Connectivity Stats */}
          {storageStats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}
                >
                  💾
                </div>
                <div>
                  <div className="stat-value">{formatBytes(storageStats.totalSize)}</div>
                  <div className="stat-label">Total Backups Volume</div>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}
                >
                  📁
                </div>
                <div>
                  <div className="stat-value">{storageStats.totalCount}</div>
                  <div className="stat-label">Backups Stored</div>
                </div>
              </div>
              <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                <div
                  className="stat-icon"
                  style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}
                >
                  🛡️
                </div>
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                      {storageStats.storageType}
                    </span>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      {storageStats.utilizationPercentage}% Used
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '4px',
                      marginTop: '0.4rem',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${storageStats.utilizationPercentage}%`,
                        background: 'linear-gradient(90deg, #60a5fa, #8b5cf6)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup Action Forms Container */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Run Manual Backup Card */}
            <div className="chart-container">
              <div className="chart-header" style={{ marginBottom: '1.2rem' }}>
                <h2>Manual System Backup</h2>
                <p>Run immediate secure backup of database or uploaded files storage.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    Select Backup Target Type:
                  </label>
                  <select
                    value={backupType}
                    onChange={(e) => setBackupType(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    <option value="full">Database Full Backup (.enc)</option>
                    <option value="incremental">Database Incremental Backup (.enc)</option>
                    <option value="trlog">Database Transaction Log (.enc)</option>
                    <option value="files">File Storage uploads/ Sync</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleManualBackup}
                  style={{ width: '100%', padding: '0.7rem' }}
                >
                  ⚡ Execute Backup Now
                </button>
              </div>
            </div>

            {/* Point-in-Time Recovery selector */}
            <div className="chart-container">
              <div className="chart-header" style={{ marginBottom: '1.2rem' }}>
                <h2>Point-in-Time Recovery (PITR)</h2>
                <p>Restore the application database to any specific point in the last 7 days.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    Choose Recovery Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={pitrTimestamp}
                    onChange={(e) => setPitrTimestamp(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <button
                  className="btn btn-outline"
                  onClick={handlePITR}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    color: '#fbbf24',
                    borderColor: 'rgba(245,158,11,0.5)',
                  }}
                >
                  ⏪ Perform PITR Restore
                </button>
              </div>
            </div>
          </div>

          {/* S3 backup files list table */}
          <div className="chart-container" style={{ width: '100%' }}>
            <div className="chart-header" style={{ marginBottom: '1.5rem' }}>
              <h2>Stored Backup Snapshots</h2>
              <p>AES-256 encrypted database dumps and configuration files stored securely.</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Filename / Key</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Backup Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Compressed Size</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Storage Region</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Created At</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}
                      >
                        No backups stored. Run a manual backup above to create one.
                      </td>
                    </tr>
                  ) : (
                    backups.map((backup) => (
                      <tr
                        key={backup.key}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.95rem',
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <code style={{ color: '#fff', fontSize: '0.85rem' }}>
                            {backup.filename}
                          </code>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background:
                                backup.type === 'full'
                                  ? 'rgba(59,130,246,0.15)'
                                  : 'rgba(139,92,246,0.15)',
                              color: backup.type === 'full' ? '#60a5fa' : '#a78bfa',
                            }}
                          >
                            {backup.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                          {formatBytes(backup.size)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            {backup.location === 's3' ? 'AWS S3 Redundant' : 'Local Storage'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                          {formatDate(backup.date)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleRestore(backup.key)}
                              style={{
                                padding: '0.35rem 0.7rem',
                                fontSize: '0.8rem',
                                color: '#34d399',
                                borderColor: 'rgba(52,211,153,0.4)',
                                background: 'transparent',
                              }}
                            >
                              Restore
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleDeleteBackup(backup.key)}
                              style={{
                                padding: '0.35rem 0.7rem',
                                fontSize: '0.8rem',
                                color: '#ef4444',
                                borderColor: 'rgba(239,68,68,0.4)',
                                background: 'transparent',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly automated verification restore testing logs */}
          <div className="chart-container" style={{ width: '100%' }}>
            <div className="chart-header" style={{ marginBottom: '1.5rem' }}>
              <h2>Automated Recovery Verification History</h2>
              <p>
                History of monthly recovery verification tests asserting backup file structural
                consistency and RTO/RPO metrics.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Test Time</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Backup Key Evaluated</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Restore Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Details / Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {restoreLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}
                      >
                        No recovery verification runs found.
                      </td>
                    </tr>
                  ) : (
                    restoreLogs.map((log) => (
                      <tr
                        key={log.id || log.verified_at}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.95rem',
                        }}
                      >
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                          {formatDate(log.verified_at)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <code style={{ fontSize: '0.8rem' }}>{log.backup_key || 'N/A'}</code>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{log.restore_type}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              color: log.status === 'success' ? '#34d399' : '#f87171',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                            }}
                          >
                            {log.status === 'success' ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                          {log.duration_ms}ms
                        </td>
                        <td
                          style={{
                            padding: '1rem',
                            color: log.error_message ? '#fca5a5' : 'rgba(255,255,255,0.6)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {log.error_message ||
                            'Verification checks passed (RTO < 1 hour, table structural schema validated)'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

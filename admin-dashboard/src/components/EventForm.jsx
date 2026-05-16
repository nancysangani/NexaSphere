import { useState } from 'react';
import { api } from '../services/api';
import { AdminIcon } from './AdminIcon';

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

// Convert "YYYY-MM-DD" → "March 14, 2025"
function toDisplayDate(isoVal) {
  if (!isoVal) return '';
  const d = new Date(isoVal + 'T00:00:00');
  if (isNaN(d)) return isoVal;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Convert "March 14, 2025" → "2025-03-14" for the date input
function toISODate(displayVal) {
  if (!displayVal) return '';
  const d = new Date(displayVal);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

const empty = {
  name: '', shortName: '', dateText: '', dateISO: '',
  description: '', icon: 'Calendar', status: 'upcoming',
  location: '', registrationLink: '', tagsInput: ''
};

export function EventForm({ event, onClose }) {
  const [form, setForm] = useState(event
    ? {
        ...event,
        tagsInput: Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''),
        dateISO: toISODate(event.dateText ?? event.date ?? ''),
      }
    : empty
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDateChange = (isoVal) => {
    setForm(f => ({
      ...f,
      dateISO: isoVal,
      dateText: toDisplayDate(isoVal),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = form.tagsInput
        ? form.tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const payload = { ...form, tags };
      delete payload.tagsInput;
      delete payload.dateISO; // only send dateText to Java

      if (event?.id) {
        await api.events.update(event.id, payload);
      } else {
        await api.events.create(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{event?.id ? 'Edit Event' : 'New Event'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><AdminIcon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Event Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. KSS #153 — Knowledge Sharing Session" required />
          </div>
          <div className="form-row">
            <label>Short Name</label>
            <input value={form.shortName || ''} onChange={e => set('shortName', e.target.value)} placeholder="e.g. KSS #153" />
          </div>

          {/* Date Picker */}
          <div className="form-row">
            <label>Event Date</label>
            <input
              type="date"
              value={form.dateISO || ''}
              onChange={e => handleDateChange(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            {form.dateText && (
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
                📅 Will display as: <strong style={{ color: 'var(--text)' }}>{form.dateText}</strong>
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Icon <span style={{ fontWeight: 400, textTransform: 'none' }}>(icon name e.g. Brain, Wrench, Rocket)</span></label>
            <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="Brain" />
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Tags <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
            <input value={form.tagsInput || ''} onChange={e => set('tagsInput', e.target.value)} placeholder="AI, Learning, Community" />
          </div>
          <div className="form-row">
            <label>Location</label>
            <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Lab 204, Online" />
          </div>
          <div className="form-row">
            <label>Registration Link</label>
            <input value={form.registrationLink || ''} onChange={e => set('registrationLink', e.target.value)} type="url" placeholder="https://..." />
          </div>
          <div className="form-row">
            <label>Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

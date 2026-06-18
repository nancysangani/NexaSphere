import React, { useState } from 'react';
import { useRecommendations, useTrendingEvents } from '../hooks/useRecommendations';

const INTEREST_OPTIONS = [
  'AI',
  'Machine Learning',
  'Web Development',
  'Cloud Computing',
  'Cybersecurity',
  'Data Science',
  'Mobile Development',
  'Open Source',
  'DevOps',
  'Blockchain',
  'UI/UX Design',
  'Game Development',
  'IoT',
  'AR/VR',
  'Robotics',
];

// ----- Small reusable card -----
function EventCard({ event, onInteract }) {
  return (
    <article
      className="rec-card"
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '1rem',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.07)',
        cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onClick={() => onInteract?.(event.id, 'viewed')}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          color: '#6366f1',
        }}
      >
        {event.status}
      </span>
      <h3 style={{ margin: '6px 0 4px', fontSize: '1rem', color: '#1e293b' }}>{event.name}</h3>
      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{event.date}</p>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(event.tags || []).map((tag) => (
          <span
            key={tag}
            style={{
              background: '#ede9fe',
              color: '#7c3aed',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {event._score !== undefined && (
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
          Relevance score: {event._score}
        </p>
      )}
    </article>
  );
}

// ----- Preference selector -----
function PreferenceSelector({ currentInterests = [], onSave }) {
  const [selected, setSelected] = useState(new Set(currentInterests));

  const toggle = (interest) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(interest) ? next.delete(interest) : next.add(interest);
      return next;
    });
  };

  return (
    <div
      style={{
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        background: '#f8fafc',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#1e293b' }}>Your Interests</h3>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        Select topics you care about to personalise your event feed.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
        {INTEREST_OPTIONS.map((interest) => (
          <button
            key={interest}
            onClick={() => toggle(interest)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1.5px solid',
              borderColor: selected.has(interest) ? '#6366f1' : '#cbd5e1',
              background: selected.has(interest) ? '#ede9fe' : '#fff',
              color: selected.has(interest) ? '#6366f1' : '#475569',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all .15s',
            }}
          >
            {interest}
          </button>
        ))}
      </div>
      <button
        onClick={() => onSave([...selected])}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Save Preferences
      </button>
    </div>
  );
}

// ----- Main page -----
export default function EventDiscoveryPage({ userId }) {
  const [showPrefs, setShowPrefs] = useState(false);

  const { recommendations, source, total, loading, error, trackInteraction, savePreferences } =
    useRecommendations(userId, { limit: 12 });

  const { trending } = useTrendingEvents({ limit: 5 });

  const handleSavePreferences = async (interests) => {
    await savePreferences(interests);
    setShowPrefs(false);
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '2rem 1rem',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Discover Events</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {source === 'content-based'
              ? 'Personalised picks based on your interests'
              : source === 'trending'
                ? 'Showing trending events — set your interests to personalise'
                : 'Find events that match what you love'}
          </p>
        </div>
        <button
          onClick={() => setShowPrefs((p) => !p)}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: '1.5px solid #6366f1',
            background: showPrefs ? '#6366f1' : '#fff',
            color: showPrefs ? '#fff' : '#6366f1',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {showPrefs ? 'Hide Preferences' : '⚙ Set Preferences'}
        </button>
      </div>

      {/* Preference selector */}
      {showPrefs && (
        <div style={{ marginBottom: '2rem' }}>
          <PreferenceSelector onSave={handleSavePreferences} />
        </div>
      )}

      {/* Trending strip */}
      {trending.length > 0 && (
        <div
          style={{ marginBottom: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: 10 }}
        >
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#92400e', fontSize: 13 }}>
            🔥 Trending this week
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {trending.map((t) => (
              <span key={t.eventId} style={{ fontSize: 12, color: '#78350f' }}>
                {t.eventId} ({t.interactionCount} interactions)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations grid */}
      {loading && <p style={{ color: '#64748b' }}>Loading recommendations…</p>}
      {error && <p style={{ color: '#ef4444' }}>Failed to load recommendations: {error}</p>}
      {!loading && recommendations.length === 0 && (
        <p style={{ color: '#64748b' }}>
          No recommendations yet. Set your interests above to get started!
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {recommendations.map((event) => (
          <EventCard key={event.id} event={event} onInteract={trackInteraction} />
        ))}
      </div>

      {total > recommendations.length && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1.5rem', fontSize: 13 }}>
          Showing {recommendations.length} of {total} recommendations
        </p>
      )}
    </div>
  );
}

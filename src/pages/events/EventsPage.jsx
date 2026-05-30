import { useState, useEffect } from 'react';
import { events as fallbackEvents } from '../../data/eventsData';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';

function EventModal({ event, onClose }) {
  if (!event) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '20px',
            borderBottom: '1px solid var(--bdr)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--t1)' }}>Event Details</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--t2)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <DynamicIcon name="X" size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--c1)', marginBottom: '8px' }}>
            {event.name}
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              color: 'var(--t2)',
              fontSize: '0.9rem',
              marginBottom: '20px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DynamicIcon name="Calendar" size={14} /> {event.dateText || event.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DynamicIcon name="MapPin" size={14} /> {event.location || 'TBA'}
            </span>
          </div>

          <p style={{ color: 'var(--t2)', lineHeight: 1.6, marginBottom: '24px' }}>
            {event.description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                background: 'var(--card)',
                padding: '16px',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--bdr)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--t3)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Mentor / Speaker
              </div>
              <div style={{ color: 'var(--t1)', fontWeight: 600 }}>Guest Expert (TBA)</div>
            </div>
            <div
              style={{
                background: 'var(--card)',
                padding: '16px',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--bdr)',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--t3)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Seat Availability
              </div>
              <div style={{ color: 'var(--t1)', fontWeight: 600 }}>
                {event.capacity
                  ? `${Math.floor(Math.random() * 20) + 10} / ${event.capacity} Available`
                  : 'Unlimited'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--t3)',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Tags
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {event.tags?.map((t) => (
                <span
                  key={t}
                  style={{
                    background: 'var(--c1-18)',
                    color: 'var(--c1)',
                    border: '1px solid var(--c1-35)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {event.status === 'upcoming' ? (
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--c1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--r2)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              >
                Register Now
              </button>
            ) : (
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--card)',
                  color: 'var(--t1)',
                  border: '1px solid var(--bdr)',
                  borderRadius: 'var(--r2)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Watch Recording
              </button>
            )}
            <button
              style={{
                padding: '12px',
                background: 'var(--card)',
                color: 'var(--t1)',
                border: '1px solid var(--bdr)',
                borderRadius: 'var(--r2)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <DynamicIcon name="Link" size={16} /> Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onOpen }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (event.status !== 'upcoming' || !event.startDate) return;

    const updateTime = () => {
      const diff = new Date(event.startDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Started');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setTimeLeft(days > 0 ? `${days}d ${hours}h left` : `${hours}h left`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [event]);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--bdr)',
        borderRadius: 'var(--r3)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="event-glass-card"
      onClick={() => onOpen(event)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 12px 30px ${event.status === 'upcoming' ? 'rgba(123,111,255,0.2)' : 'rgba(255,255,255,0.05)'}`;
        e.currentTarget.style.borderColor =
          event.status === 'upcoming' ? 'rgba(123,111,255,0.4)' : 'var(--bdr)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = 'var(--bdr)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          bottom: 0,
          background:
            event.status === 'upcoming'
              ? 'linear-gradient(to bottom, #7b6fff, #00d4ff)'
              : 'var(--bdr)',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '4px',
            background:
              event.status === 'upcoming' ? 'rgba(123,111,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: event.status === 'upcoming' ? '#7b6fff' : 'var(--t3)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {event.status}
        </span>
        {event.status === 'upcoming' && timeLeft && (
          <span
            style={{
              fontSize: '0.8rem',
              color: '#00d4ff',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <DynamicIcon name="Clock" size={14} /> {timeLeft}
          </span>
        )}
      </div>

      <h3
        style={{ fontSize: '1.25rem', color: 'var(--t1)', margin: '0 0 12px 0', lineHeight: 1.3 }}
      >
        {event.name}
      </h3>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--t2)',
          flex: 1,
          marginBottom: '20px',
          lineHeight: 1.5,
        }}
      >
        {event.description?.substring(0, 100)}...
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          borderTop: '1px solid var(--bdr)',
          paddingTop: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--t3)',
          }}
        >
          <DynamicIcon name="Users" size={14} />
          {event.capacity ? `${event.capacity} Seats` : 'Open'}
        </div>
        <button
          style={{
            background:
              event.status === 'upcoming'
                ? 'linear-gradient(135deg, #7b6fff, #00d4ff)'
                : 'transparent',
            color: event.status === 'upcoming' ? '#fff' : 'var(--t2)',
            border: event.status === 'upcoming' ? 'none' : '1px solid var(--bdr)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {event.status === 'upcoming' ? 'Register' : 'Details'}
        </button>
      </div>
    </div>
  );
}

export default function EventsPage({ onBack, events = fallbackEvents }) {
  const [filter, setFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const now = Date.now();
  const getEffectiveStatus = (ev) => {
    if (ev.status === 'completed') return 'completed';
    const d = ev.startDate ? new Date(ev.startDate) : null;
    if (d && d.getTime() < now) return 'completed';
    return ev.status || 'upcoming';
  };

  const processedEvents = events.map((ev) => ({ ...ev, status: getEffectiveStatus(ev) }));

  const filteredEvents = processedEvents
    .filter((ev) => {
      if (filter === 'All') return true;
      return ev.status.toLowerCase() === filter.toLowerCase();
    })
    .sort((a, b) => {
      const dA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dB = b.startDate ? new Date(b.startDate).getTime() : 0;
      if (filter === 'Upcoming') return dA - dB;
      return dB - dA;
    });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div
      id="events-page"
      style={{ minHeight: '100vh', padding: '0 0 100px', position: 'relative' }}
    >
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '70px 0 50px',
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',
          }}
        />
        <BannerOrbs color="rgba(123,111,255,.06)" />
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: '50px',
            padding: '7px 16px',
            color: 'var(--t2)',
            fontSize: '.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          ← Back
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="cin-section-label" style={{ animation: 'fadeIn .5s ease' }}>
            NexaSphere · GL Bajaj
          </span>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', animation: 'fadeInUp .6s ease' }}
          >
            Our Events
          </h1>
          <p
            className="section-subtitle"
            style={{
              animation: 'fadeInUp .7s ease',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Where ideas come to life. Every event is a milestone in the NexaSphere journey.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '32px',
            position: 'relative',
            zIndex: 2,
            animation: 'fadeInUp .8s ease',
          }}
        >
          {['All', 'Upcoming', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 24px',
                background: filter === f ? '#7b6fff' : 'rgba(255,255,255,0.02)',
                color: filter === f ? '#fff' : 'var(--t2)',
                border: `1px solid ${filter === f ? '#7b6fff' : 'var(--bdr)'}`,
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filter === f ? '0 4px 15px rgba(123,111,255,0.4)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
            animation: 'fadeInUp 0.9s ease',
          }}
        >
          {filteredEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} onOpen={setSelectedEvent} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            No events found for this category.
          </div>
        )}
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <Footer />
    </div>
  );
}

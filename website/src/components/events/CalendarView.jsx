import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useSocket from '../../hooks/useSocketConnection';
import './CalendarView.css';

/**
 * Interactive Event Calendar
 * Features: Month/Week/Day/Agenda views, Drag-and-Drop rescheduling,
 * Conflict detection, Color coding, and Real-time updates.
 */
export default function CalendarView({ events: initialEvents, onEventClick, isAdmin = false }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day, agenda, timeline
  const [events, setEvents] = useState(initialEvents);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // registered, not-registered
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedEvent, setDraggedEvent] = useState(null);

  const { on: onSocket } = useSocket();

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = onSocket('calendar:event-updated', (updatedEvent) => {
      setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
    });
    return unsubscribe;
  }, [onSocket]);

  const parseEventDate = (dateStr) => {
    if (!dateStr) return null;
    let normalized = dateStr;
    if (!/\d{4}/.test(dateStr)) {
      normalized = `${dateStr}, ${currentDate.getFullYear()}`;
    }
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  };

  // Filtering logic
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesType =
        filterType === 'all' || ev.category?.toLowerCase() === filterType.toLowerCase();
      const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'registered' && ev.userIsRegistered) ||
        (filterStatus === 'full' && ev.registrationCount >= ev.capacity);

      return matchesType && matchesSearch && matchesStatus;
    });
  }, [events, filterType, searchQuery, filterStatus]);

  // Conflict Detection
  const checkConflict = (eventId, newDate, hour = null) => {
    const dateKey = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`;
    return events.some((ev) => {
      if (ev.id === eventId) return false;
      const d = parseEventDate(ev.date);
      const sameDay = d && `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === dateKey;
      if (hour === null) return sameDay;
      return sameDay && d.getHours() === hour;
    });
  };

  const handleDrop = async (e, targetDate, hour = null) => {
    e.preventDefault();
    if (!isAdmin || !draggedEvent) return;

    if (checkConflict(draggedEvent.id, targetDate, hour)) {
      if (!window.confirm('This slot already has an event. Reschedule anyway?')) return;
    }

    const newDate = new Date(targetDate);
    if (hour !== null) newDate.setHours(hour, 0, 0, 0);

    const updatedEvent = { ...draggedEvent, date: newDate.toISOString() };
    setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
    setDraggedEvent(null);
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach((ev) => {
      const d = parseEventDate(ev.date);
      if (d) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    });
    return map;
  }, [filteredEvents]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
    <div key={`blank-${i}`} className="calendar-cell blank"></div>
  ));

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  const renderMonthView = () => {
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const dateNum = i + 1;
      const isToday = isCurrentMonth && today.getDate() === dateNum;
      const targetDate = new Date(currentYear, currentMonth, dateNum);
      const key = `${currentYear}-${currentMonth}-${dateNum}`;
      const dayEvents = eventsByDate[key] || [];

      return (
        <div
          key={`day-${dateNum}`}
          className={`calendar-cell ${isToday ? 'today' : ''}`}
          onDragOver={(e) => isAdmin && e.preventDefault()}
          onDrop={(e) => handleDrop(e, targetDate)}
        >
          <div className="calendar-day-header">{dateNum}</div>
          <div className="calendar-day-events">
            {dayEvents.map((ev) => (
              <EventChip
                key={ev.id}
                ev={ev}
                onEventClick={onEventClick}
                isAdmin={isAdmin}
                onDragStart={() => setDraggedEvent(ev)}
              />
            ))}
          </div>
        </div>
      );
    });

    return (
      <div className="calendar-grid">
        {daysOfWeek.map((d) => (
          <div key={d} className="calendar-day-label">
            {d}
          </div>
        ))}
        {blanks}
        {days}
      </div>
    );
  };

  const renderTimeGridView = (isDayView) => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const daysToRender = isDayView
      ? [currentDate]
      : Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(currentDate);
          d.setDate(d.getDate() - d.getDay() + i);
          return d;
        });

    return (
      <div className={`calendar-time-grid ${isDayView ? 'day-mode' : 'week-mode'}`}>
        <div className="time-column">
          <div className="time-slot-header">Time</div>
          {hours.map((h) => (
            <div key={h} className="time-label">
              {h}:00
            </div>
          ))}
        </div>
        {daysToRender.map((date, idx) => {
          const keyPrefix = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          return (
            <div key={idx} className="day-column">
              <div className="time-slot-header">
                {isDayView ? '' : daysOfWeek[idx]} {date.getDate()}
              </div>
              {hours.map((h) => {
                const hourEvents = (eventsByDate[keyPrefix] || []).filter((ev) => {
                  const d = parseEventDate(ev.date);
                  return d && d.getHours() === h;
                });
                return (
                  <div
                    key={h}
                    className="time-slot"
                    onDragOver={(e) => isAdmin && e.preventDefault()}
                    onDrop={(e) => handleDrop(e, date, h)}
                  >
                    {hourEvents.map((ev) => (
                      <EventChip
                        key={ev.id}
                        ev={ev}
                        onEventClick={onEventClick}
                        isAdmin={isAdmin}
                        onDragStart={() => setDraggedEvent(ev)}
                        isCompact
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimelineView = () => (
    <div className="calendar-timeline">
      {['Workshop', 'Talk', 'Hackathon', 'Social'].map((cat) => (
        <div key={cat} className="timeline-row">
          <div className="timeline-label">{cat}</div>
          <div className="timeline-content">
            {filteredEvents
              .filter((e) => e.category === cat)
              .map((ev) => (
                <EventChip
                  key={ev.id}
                  ev={ev}
                  onEventClick={onEventClick}
                  isAdmin={isAdmin}
                  onDragStart={() => setDraggedEvent(ev)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAgendaView = () => (
    <div className="calendar-agenda">
      {filteredEvents
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((ev) => (
          <div key={ev.id} className="agenda-item" onClick={() => onEventClick(ev)}>
            <div className="agenda-date">{new Date(ev.date).toLocaleDateString()}</div>
            <div className={`agenda-type-tag ${ev.category?.toLowerCase()}`}>{ev.category}</div>
            <div className="agenda-info">
              <h4>{ev.name}</h4>
              <p>
                {ev.location} • {ev.registrationCount || 0} Registered
              </p>
            </div>
            <div className={`agenda-status ${ev.status}`}>{ev.status}</div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="calendar-container pop-in">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Prev">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="calendar-title">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="calendar-controls">
          <div className="view-switcher">
            {['month', 'week', 'day', 'agenda', 'timeline'].map((v) => (
              <button
                key={v}
                className={`view-btn ${view === v ? 'active' : ''}`}
                onClick={() => setView(v)}
              >
                {v === 'month'
                  ? 'Mo'
                  : v === 'week'
                    ? 'Wk'
                    : v === 'day'
                      ? 'Dy'
                      : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="calendar-search"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="workshop">Workshops</option>
            <option value="hackathon">Hackathons</option>
            <option value="kss">KSS Sessions</option>
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="registered">Registered</option>
            <option value="full">Event Full</option>
          </select>

          <a
            href="/api/events/calendar/feed"
            className="calendar-sync-btn mag-btn"
            title="Sync with Google/Outlook"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </a>
        </div>
      </div>

      {view === 'month' && renderMonthView()}
      {(view === 'week' || view === 'day') && renderTimeGridView(view === 'day')}
      {view === 'agenda' && renderAgendaView()}
      {view === 'timeline' && renderTimelineView()}
    </div>
  );
}

function EventChip({ ev, onEventClick, isAdmin, onDragStart, isCompact = false }) {
  const isKSS = String(ev.shortName || ev.name)
    .toLowerCase()
    .includes('kss');
  const categoryClass = ev.category?.toLowerCase() || 'default';
  const isFull = ev.registrationCount >= (ev.capacity || 100);

  return (
    <div
      draggable={isAdmin}
      onDragStart={onDragStart}
      className={`calendar-event-chip ${ev.status} ${categoryClass} ${isKSS ? 'kss-event' : ''} ${isCompact ? 'compact' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick && onEventClick(ev);
      }}
      title={`${ev.name}\nLocation: ${ev.location}\nStatus: ${ev.status}`}
    >
      <div className="event-chip-dot"></div>
      {!isCompact && <span className="event-chip-title">{ev.shortName || ev.name}</span>}
      {ev.userIsRegistered && <span className="registered-indicator">✓</span>}
      {isFull && (
        <span className="status-indicator-full" title="Event Full">
          ●
        </span>
      )}
    </div>
  );
}

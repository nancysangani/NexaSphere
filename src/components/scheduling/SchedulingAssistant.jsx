// src/components/scheduling/SchedulingAssistant.jsx
import { useState, useEffect } from 'react';
import { schedulingEngine } from '../../services/scheduling/schedulingEngine';
import { DynamicIcon } from '../../shared/Icons';

export default function SchedulingAssistant({ events, onEventClick }) {
  const [proposedEvent, setProposedEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    speaker: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [optimalSlots, setOptimalSlots] = useState(null);
  const [predictedAttendance, setPredictedAttendance] = useState(null);

  useEffect(() => {
    if (events && events.length > 0) {
      schedulingEngine.loadEvents(events);
      setOptimalSlots(schedulingEngine.getOptimalTimeSlots());
    }
  }, [events]);

  const handleAnalyze = () => {
    if (!proposedEvent.startDate || !proposedEvent.endDate) {
      alert('Please select date and time');
      return;
    }

    const detectedConflicts = schedulingEngine.detectConflicts(proposedEvent);
    const attendance = schedulingEngine.predictAttendance(proposedEvent);

    setConflicts(detectedConflicts);
    setPredictedAttendance(attendance);
    setAnalysis({
      hasConflicts: detectedConflicts.length > 0,
      conflictCount: detectedConflicts.length,
      isOptimal: !detectedConflicts.length && attendance > 70,
    });
  };

  const getStatusColor = () => {
    if (!analysis) return '#6B7280';
    if (analysis.hasConflicts) return '#EF4444';
    if (analysis.isOptimal) return '#10B981';
    return '#F59E0B';
  };

  const getStatusMessage = () => {
    if (!analysis) return 'Ready to analyze';
    if (analysis.hasConflicts) return `${analysis.conflictCount} Conflict(s) Detected`;
    if (analysis.isOptimal) return 'Optimal Schedule! ✓';
    return 'Acceptable Schedule';
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Panel - Event Form */}
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}
        >
          <h3
            style={{
              color: '#FFFFFF',
              marginBottom: '20px',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <DynamicIcon name="Calendar" size={20} style={{ color: '#CC1111' }} />
            New Event Schedule
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '13px' }}
            >
              Event Title
            </label>
            <input
              type="text"
              aria-label="Event Title"
              value={proposedEvent.title}
              onChange={(e) => setProposedEvent({ ...proposedEvent, title: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#0A0A0A',
                border: '1px solid #2A2A2A',
                color: '#FFFFFF',
              }}
              placeholder="e.g., AI Workshop 2026"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '13px' }}
            >
              Description
            </label>
            <textarea
              value={proposedEvent.description}
              onChange={(e) => setProposedEvent({ ...proposedEvent, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#0A0A0A',
                border: '1px solid #2A2A2A',
                color: '#FFFFFF',
                minHeight: '80px',
              }}
              placeholder="Event description..."
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                aria-label="Start Date and Time"
                value={proposedEvent.startDate}
                onChange={(e) => setProposedEvent({ ...proposedEvent, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0A0A0A',
                  border: '1px solid #2A2A2A',
                  color: '#FFFFFF',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                End Date & Time
              </label>
              <input
                type="datetime-local"
                aria-label="End Date and Time"
                value={proposedEvent.endDate}
                onChange={(e) => setProposedEvent({ ...proposedEvent, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0A0A0A',
                  border: '1px solid #2A2A2A',
                  color: '#FFFFFF',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '13px' }}
            >
              Venue
            </label>
            <select
              value={proposedEvent.venue}
              onChange={(e) => setProposedEvent({ ...proposedEvent, venue: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#0A0A0A',
                border: '1px solid #2A2A2A',
                color: '#FFFFFF',
              }}
            >
              <option value="">Select Venue</option>
              <option value="Main Auditorium">Main Auditorium</option>
              <option value="Conference Hall">Conference Hall</option>
              <option value="Seminar Room 203">Seminar Room 203</option>
              <option value="Computer Lab">Computer Lab</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '13px' }}
            >
              Speaker (Optional)
            </label>
            <input
              type="text"
              aria-label="Speaker"
              value={proposedEvent.speaker}
              onChange={(e) => setProposedEvent({ ...proposedEvent, speaker: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#0A0A0A',
                border: '1px solid #2A2A2A',
                color: '#FFFFFF',
              }}
              placeholder="Speaker name"
            />
          </div>

          <button
            onClick={handleAnalyze}
            style={{
              width: '100%',
              padding: '12px',
              background: '#CC1111',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Analyze Schedule
          </button>
        </div>

        {/* Right Panel - Results */}
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}
        >
          <h3
            style={{
              color: '#FFFFFF',
              marginBottom: '20px',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <DynamicIcon name="TrendingUp" size={20} style={{ color: '#CC1111' }} />
            Schedule Analysis
          </h3>

          {analysis ? (
            <>
              {/* Status Card */}
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: `rgba(${analysis.hasConflicts ? '239,68,68' : analysis.isOptimal ? '16,185,129' : '245,158,11'}, 0.1)`,
                  borderRadius: '12px',
                  border: `1px solid ${getStatusColor()}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>
                    {analysis.hasConflicts ? '⚠️' : analysis.isOptimal ? '✅' : '📊'}
                  </span>
                  <div>
                    <p style={{ color: '#FFFFFF', fontWeight: '500' }}>{getStatusMessage()}</p>
                    {predictedAttendance && (
                      <p style={{ color: '#9CA3AF', fontSize: '13px' }}>
                        Predicted Attendance: {predictedAttendance}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optimal Time Slots */}
              {optimalSlots && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#9CA3AF', marginBottom: '12px', fontSize: '13px' }}>
                    🎯 Recommended Time Slots
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {optimalSlots.bestTimeRanges.map((slot, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 12px',
                          background: '#0A0A0A',
                          borderRadius: '20px',
                          color: '#CC1111',
                          fontSize: '12px',
                        }}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Days */}
              {optimalSlots && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#9CA3AF', marginBottom: '12px', fontSize: '13px' }}>
                    📅 Best Days for Events
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {optimalSlots.bestDays.map((day, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 12px',
                          background: '#0A0A0A',
                          borderRadius: '20px',
                          color: '#10B981',
                          fontSize: '12px',
                        }}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicts List */}
              {conflicts.length > 0 && (
                <div>
                  <p style={{ color: '#9CA3AF', marginBottom: '12px', fontSize: '13px' }}>
                    ⚠️ Detected Conflicts
                  </p>
                  {conflicts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        background: '#0A0A0A',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${c.severity === 'high' ? '#EF4444' : '#F59E0B'}`,
                      }}
                    >
                      <p style={{ color: '#FFFFFF', fontSize: '13px' }}>{c.description}</p>
                      <p style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px' }}>
                        💡 {c.suggestedAction}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Success Message */}
              {!analysis.hasConflicts && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(16,185,129,0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ color: '#10B981', fontSize: '13px', textAlign: 'center' }}>
                    ✓ No conflicts! This time slot works perfectly.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <DynamicIcon
                name="Calendar"
                size={48}
                style={{ marginBottom: '16px', opacity: 0.5 }}
              />
              <p>Enter event details and click "Analyze Schedule"</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Get AI-powered conflict detection and optimal time recommendations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div
        style={{
          marginTop: '32px',
          padding: '20px',
          background: '#1A1A1A',
          borderRadius: '16px',
          border: '1px solid #2A2A2A',
        }}
      >
        <h4 style={{ color: '#FFFFFF', marginBottom: '12px', fontSize: '14px' }}>
          How Smart Scheduling Works
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <p style={{ color: '#CC1111', fontWeight: '500', marginBottom: '4px' }}>
              1. Enter Details
            </p>
            <p style={{ color: '#6B7280', fontSize: '12px' }}>Fill in event title, date, venue</p>
          </div>
          <div>
            <p style={{ color: '#CC1111', fontWeight: '500', marginBottom: '4px' }}>
              2. AI Analysis
            </p>
            <p style={{ color: '#6B7280', fontSize: '12px' }}>
              Detects conflicts with existing events
            </p>
          </div>
          <div>
            <p style={{ color: '#CC1111', fontWeight: '500', marginBottom: '4px' }}>
              3. Get Recommendations
            </p>
            <p style={{ color: '#6B7280', fontSize: '12px' }}>
              Receive optimal time slots and conflict resolution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

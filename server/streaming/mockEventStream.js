/**
 * Deterministic mock event stream generator used by QA tests.
 */

export function buildMockUserActionEvent({
  type,
  userId,
  eventId,
  timestamp,
  metadata = {},
  sessionId,
  ip,
  partitionKey = userId,
} = {}) {
  return {
    type,
    user_id: String(userId),
    event_id: String(eventId),
    timestamp: timestamp ?? new Date().toISOString(),
    metadata: {
      ...(metadata || {}),
      ...(sessionId ? { session_id: sessionId } : null),
      ...(ip ? { ip } : null),
    },
    partition_key: partitionKey,
  };
}

export function buildMockStreamScenario({
  userId = 'u1',
  eventId = 'e1',
  baseTime = new Date('2026-01-01T00:00:00.000Z'),
  minutes = [0, 0, 1, 2, 3, 4, 4],
} = {}) {
  const [t0, t1, t2, t3, t4, t5, t6] = minutes;

  return [
    buildMockUserActionEvent({
      type: 'viewed',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t0 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'registered',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t1 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'viewed',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t2 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'registered',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t3 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'liked',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t4 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'registered',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t5 * 60_000).toISOString(),
    }),
    buildMockUserActionEvent({
      type: 'registered',
      userId,
      eventId,
      timestamp: new Date(baseTime.getTime() + t6 * 60_000).toISOString(),
      metadata: { unexpected_burst: true },
    }),
  ];
}

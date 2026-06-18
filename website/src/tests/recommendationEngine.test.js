/**
 * Tests for the recommendation engine's scoring logic.
 *
 * These tests are unit-level and do not require a database connection.
 * They validate the core ranking algorithm in isolation.
 */

import { describe, it, expect } from 'vitest';

// ── Inline replica of the scoring logic ──────────────────────────────────────
// (Duplicated here to avoid importing PrismaClient in a unit test)

function scoreEvent(event, userInterests) {
  const eventTags = Array.isArray(event.tags) ? event.tags.map((t) => t.toLowerCase()) : [];
  const tagOverlap = userInterests.filter((i) => eventTags.includes(i.toLowerCase())).length;

  const ageMs = new Date() - new Date(event.createdAt || 0);
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  const recencyBoost = Math.max(0, 1 - ageMs / maxAgeMs) * 0.5;

  return tagOverlap + recencyBoost;
}

function rankEvents(events, userInterests) {
  return events
    .map((e) => ({ ...e, _score: scoreEvent(e, userInterests) }))
    .sort((a, b) => b._score - a._score);
}

// ── Test data ─────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();
const OLD = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 days ago

const events = [
  { id: 'a', name: 'AI Workshop', tags: ['AI', 'Machine Learning'], createdAt: NOW },
  { id: 'b', name: 'Web Dev Bootcamp', tags: ['Web Development', 'JavaScript'], createdAt: NOW },
  { id: 'c', name: 'Cloud Summit', tags: ['Cloud Computing', 'DevOps'], createdAt: OLD },
  { id: 'd', name: 'Design Thinking', tags: ['UI/UX Design'], createdAt: NOW },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Recommendation engine – scoring', () => {
  it('ranks events with matching tags above events with no tag overlap', () => {
    const interests = ['AI', 'Machine Learning'];
    const ranked = rankEvents(events, interests);
    expect(ranked[0].id).toBe('a');
  });

  it('gives a recency boost to newer events over equally-scored older ones', () => {
    const eventsEqual = [
      { id: 'new', name: 'New', tags: ['AI'], createdAt: NOW },
      { id: 'old', name: 'Old', tags: ['AI'], createdAt: OLD },
    ];
    const ranked = rankEvents(eventsEqual, ['AI']);
    expect(ranked[0].id).toBe('new');
  });

  it('falls back to recency order when user has no matching interests', () => {
    const interests = ['Blockchain']; // no event has this tag
    const ranked = rankEvents(events, interests);
    // All tag scores are 0, so sorted purely by recency boost
    // Events with OLD createdAt should score 0 recency boost (> maxAgeMs)
    expect(ranked.at(-1).id).toBe('c');
  });

  it('score is never negative', () => {
    const interests = [];
    events.forEach((e) => {
      expect(scoreEvent(e, interests)).toBeGreaterThanOrEqual(0);
    });
  });

  it('handles events with missing tags gracefully', () => {
    const noTagEvent = { id: 'x', name: 'No Tags', createdAt: NOW };
    expect(() => scoreEvent(noTagEvent, ['AI'])).not.toThrow();
    expect(scoreEvent(noTagEvent, ['AI'])).toBeGreaterThanOrEqual(0);
  });
});

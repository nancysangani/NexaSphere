import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEventRecommendations,
  getAdminEventRecommendations,
} from '../services/eventRecommendationService.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { registrationsRepository } from '../repositories/registrationsRepository.js';

test('buildEventRecommendations excludes undated drafts from historical analysis', () => {
  const result = buildEventRecommendations(
    [
      {
        id: 'draft-1',
        name: 'Draft DevOps Workshop',
        status: 'upcoming',
        date: '',
        tags: ['DevOps'],
      },
      {
        id: 'past-1',
        name: 'Completed Web Dev Workshop',
        status: 'completed',
        date: '2025-09-12',
        tags: ['Web'],
      },
    ],
    {
      'past-1': [
        {
          status: 'confirmed',
          attended: true,
          department: 'CSE',
          created_at: '2025-08-20T10:00:00.000Z',
        },
      ],
    },
    { now: new Date('2026-06-20T00:00:00.000Z') }
  );

  assert.equal(result.dataWindow.totalEvents, 2);
  assert.equal(result.dataWindow.historicalEvents, 1);
  assert.deepEqual(
    result.historicalPatterns.eventTypes.map((item) => item.type),
    ['workshop']
  );
});

test('buildEventRecommendations detects same-day similar-event conflicts', () => {
  const result = buildEventRecommendations(
    [
      {
        id: 'web-1',
        name: 'React Workshop',
        status: 'upcoming',
        date: '2026-09-15',
        tags: ['React'],
      },
      {
        id: 'web-2',
        name: 'Frontend Bootcamp',
        status: 'upcoming',
        date: '2026-09-15',
        tags: ['Web'],
      },
    ],
    {},
    { now: new Date('2026-06-20T00:00:00.000Z') }
  );

  assert.equal(result.schedulingRecommendations.conflicts.length, 1);
  assert.deepEqual(result.schedulingRecommendations.conflicts[0].events, [
    'React Workshop',
    'Frontend Bootcamp',
  ]);
});

test('getAdminEventRecommendations paginates through all admin events', async () => {
  const originalListAll = eventsRepository.listAll;
  const originalFindByEventId = registrationsRepository.findByEventId;
  const seenPages = [];

  eventsRepository.listAll = async ({ page, limit }) => {
    seenPages.push({ page, limit });
    const rows =
      page === 1
        ? Array.from({ length: 500 }, (_, index) => ({
            id: `event-${index}`,
            name: `Workshop ${index}`,
            status: 'completed',
            date: '2025-01-10',
            tags: ['Workshop'],
          }))
        : [
            {
              id: 'event-500',
              name: 'Final Workshop',
              status: 'completed',
              date: '2025-01-11',
              tags: ['Workshop'],
            },
          ];

    return { rows, total: 501 };
  };

  registrationsRepository.findByEventId = async () => [
    {
      status: 'confirmed',
      attended: true,
      created_at: '2024-12-20T10:00:00.000Z',
    },
  ];

  try {
    const result = await getAdminEventRecommendations();

    assert.equal(result.dataWindow.totalEvents, 501);
    assert.equal(result.dataWindow.historicalEvents, 501);
    assert.deepEqual(
      seenPages.map((item) => item.page),
      [1, 2]
    );
    assert.ok(seenPages.every((item) => item.limit === 500));
  } finally {
    eventsRepository.listAll = originalListAll;
    registrationsRepository.findByEventId = originalFindByEventId;
  }
});

import { eventsRepository } from '../repositories/eventsRepository.js';
import { registrationsRepository } from '../repositories/registrationsRepository.js';

const TYPE_KEYWORDS = [
  { type: 'hackathon', words: ['hackathon', 'hack', 'ideathon'] },
  { type: 'workshop', words: ['workshop', 'bootcamp', 'hands-on', 'lab'] },
  { type: 'career talk', words: ['career', 'placement', 'resume', 'interview', 'talk'] },
  { type: 'web dev', words: ['web', 'react', 'javascript', 'frontend', 'mern'] },
  { type: 'ai/ml', words: ['ai', 'ml', 'machine learning', 'data', 'tensorflow'] },
  { type: 'devops', words: ['devops', 'cloud', 'docker', 'kubernetes', 'ci/cd'] },
];

const PLANNING_WEEKS = {
  hackathon: { min: 8, max: 12 },
  workshop: { min: 2, max: 4 },
  'career talk': { min: 3, max: 5 },
  'web dev': { min: 3, max: 6 },
  'ai/ml': { min: 4, max: 7 },
  devops: { min: 4, max: 6 },
  general: { min: 3, max: 5 },
};

const TOPIC_CATALOG = ['Web Dev', 'Machine Learning', 'DevOps', 'Career', 'Open Source'];

function parseDate(value, now = new Date()) {
  if (!value) return null;
  const text = String(value).trim();
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const withYear = new Date(`${text}, ${now.getFullYear()}`);
  if (!Number.isNaN(withYear.getTime())) return withYear;

  return null;
}

function eventText(event) {
  return [event.name, event.shortName, event.description, ...(event.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function classifyEvent(event) {
  const text = eventText(event);
  const match = TYPE_KEYWORDS.find(({ words }) => words.some((word) => text.includes(word)));
  return match?.type || event.category || 'general';
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio));
  return sorted[index];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toPercent(value) {
  return `${Math.round(value)}%`;
}

function getEventStats(event, registrations, now) {
  const date = parseDate(event.date, now);
  const total = registrations.length;
  const confirmed = registrations.filter((r) => r.status !== 'waitlisted' && !r.waitlist).length;
  const attended = registrations.filter((r) => r.attended || r.status === 'attended').length;
  const createdTimes = registrations
    .map((r) => parseDate(r.created_at || r.createdAt, now))
    .filter(Boolean)
    .map((d) => d.getTime());
  const firstRegistrationAt = createdTimes.length ? new Date(Math.min(...createdTimes)) : null;
  const planningDays =
    date && firstRegistrationAt
      ? Math.max(1, Math.round((date.getTime() - firstRegistrationAt.getTime()) / 86400000))
      : null;

  return {
    ...event,
    date,
    type: classifyEvent(event),
    registrations,
    total,
    confirmed,
    attended,
    attendanceRate: confirmed > 0 ? Math.round((attended / confirmed) * 100) : 0,
    planningDays,
  };
}

function buildTypeSummaries(events) {
  const summaries = new Map();
  events.forEach((event) => {
    if (!summaries.has(event.type)) {
      summaries.set(event.type, {
        type: event.type,
        events: [],
        registrations: [],
        attendanceRates: [],
        planningDays: [],
      });
    }
    const summary = summaries.get(event.type);
    summary.events.push(event);
    summary.registrations.push(event.confirmed || event.total);
    if (event.confirmed > 0) summary.attendanceRates.push(event.attendanceRate);
    if (event.planningDays) summary.planningDays.push(event.planningDays);
  });

  return [...summaries.values()].map((summary) => ({
    ...summary,
    eventCount: summary.events.length,
    averageRegistrations: Math.round(average(summary.registrations)),
    predictedRegistrations: Math.max(0, Math.round(percentile(summary.registrations, 0.75))),
    averageAttendanceRate: Math.round(average(summary.attendanceRates)),
    medianPlanningDays: Math.round(percentile(summary.planningDays, 0.5)),
  }));
}

function buildHistoricalPatterns(completedEvents, typeSummaries) {
  const dayCounts = new Map();
  const monthCounts = new Map();
  const departmentCounts = new Map();

  completedEvents.forEach((event) => {
    if (event.date) {
      const day = event.date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = event.date.toLocaleDateString('en-US', { month: 'long' });
      dayCounts.set(day, (dayCounts.get(day) || 0) + event.confirmed);
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }

    event.registrations.forEach((registration) => {
      const department = registration.department;
      if (department) departmentCounts.set(department, (departmentCounts.get(department) || 0) + 1);
    });
  });

  const bestDay = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const seasonal = [...monthCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const demographics = [...departmentCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    sampleSize: completedEvents.length,
    eventTypes: typeSummaries.map((summary) => ({
      type: summary.type,
      events: summary.eventCount,
      averageRegistrations: summary.averageRegistrations,
      attendanceRate: summary.averageAttendanceRate,
    })),
    bestDay: bestDay ? { day: bestDay[0], registrations: bestDay[1] } : null,
    seasonal,
    demographics,
  };
}

function buildPlanningRecommendations(typeSummaries) {
  return typeSummaries.map((summary) => {
    const fallback = PLANNING_WEEKS[summary.type] || PLANNING_WEEKS.general;
    const observedWeeks = summary.medianPlanningDays
      ? Math.round(summary.medianPlanningDays / 7)
      : 0;
    const minWeeks = observedWeeks ? Math.max(fallback.min, observedWeeks - 1) : fallback.min;
    const maxWeeks = observedWeeks ? Math.max(minWeeks + 1, observedWeeks + 1) : fallback.max;

    return {
      type: summary.type,
      timeline: `${minWeeks}-${maxWeeks} weeks`,
      milestones: [
        `Finalize venue ${maxWeeks} weeks before`,
        `Announce ${Math.max(2, minWeeks)} weeks before`,
        'Close registration 1-2 weeks before',
      ],
      explanation: `${summary.eventCount} past ${summary.type} event(s) averaged ${summary.averageRegistrations} registrations with a ${summary.averageAttendanceRate || 0}% attendance rate.`,
    };
  });
}

function buildAttendancePredictions(typeSummaries) {
  return typeSummaries.map((summary) => {
    const predicted = summary.predictedRegistrations || summary.averageRegistrations;
    const attendanceRate = summary.averageAttendanceRate || 70;
    const expectedAttendees = Math.round(predicted * (attendanceRate / 100));
    return {
      type: summary.type,
      predictedRegistrations: predicted,
      expectedAttendees,
      recommendedCapacity: Math.max(20, Math.ceil(expectedAttendees * 1.15)),
      confidence: summary.eventCount >= 4 ? 'high' : summary.eventCount >= 2 ? 'medium' : 'low',
      alert:
        predicted < 20
          ? 'Predicted registrations are below 20, so validate demand before committing resources.'
          : null,
      explanation: `Prediction uses the upper quartile of registrations from ${summary.eventCount} similar event(s), adjusted by historical attendance rate.`,
    };
  });
}

function buildSchedulingRecommendations(events, historicalPatterns) {
  const datedEvents = events.filter((event) => event.date);
  const conflicts = [];
  for (let i = 0; i < datedEvents.length; i += 1) {
    for (let j = i + 1; j < datedEvents.length; j += 1) {
      const first = datedEvents[i];
      const second = datedEvents[j];
      const sameDay = first.date.toDateString() === second.date.toDateString();
      const similar = first.type === second.type || eventText(first).includes(second.type);
      if (sameDay && similar) {
        conflicts.push({
          date: first.date.toISOString().slice(0, 10),
          events: [first.name, second.name],
          explanation: `Both events are ${first.type} focused, which may split the same audience.`,
        });
      }
    }
  }

  return {
    conflicts,
    recommendations: [
      historicalPatterns.bestDay
        ? `Schedule high-priority events on ${historicalPatterns.bestDay.day}; it has the strongest historical registration volume.`
        : 'Collect more dated event data to identify the strongest weekday.',
      'Keep similar technical events at least 7 days apart to preserve momentum and avoid audience overlap.',
    ],
  };
}

function getCompletedEvents(events, now) {
  return events.filter((event) => event.status === 'completed' || (event.date && event.date < now));
}

function buildResourceRecommendations(attendancePredictions, completedEvents) {
  const coOrganizers = new Map();
  completedEvents.forEach((event) => {
    event.registrations.forEach((registration) => {
      const organizer = registration.co_organizer || registration.coOrganizer;
      if (organizer) coOrganizers.set(organizer, (coOrganizers.get(organizer) || 0) + 1);
    });
  });
  const suggestedCoOrganizers = [...coOrganizers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return attendancePredictions.map((prediction) => ({
    type: prediction.type,
    venueSize:
      prediction.expectedAttendees >= 100
        ? 'Auditorium or large hall'
        : prediction.expectedAttendees >= 50
          ? 'Seminar hall'
          : 'Lab or classroom',
    cateringQuantity: Math.ceil(prediction.expectedAttendees * 1.1),
    suggestedCoOrganizers,
    explanation: `Based on ${prediction.expectedAttendees} expected attendees plus a 10% buffer for walk-ins and organizers.`,
  }));
}

function buildTopicRecommendations(events) {
  const topicCounts = new Map();
  events.forEach((event) => {
    const text = eventText(event);
    TOPIC_CATALOG.forEach((topic) => {
      const key = topic.toLowerCase();
      if (text.includes(key) || key.split(' ').some((word) => text.includes(word))) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    });
  });

  const trending = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, mentions]) => ({
      topic,
      mentions,
      explanation: `${topic} appears in ${mentions} historical event signal(s).`,
    }));

  const gaps = TOPIC_CATALOG.filter((topic) => !topicCounts.has(topic)).map((topic) => ({
    topic,
    explanation: `No recent ${topic} event was found, so this is a portfolio gap to validate with member interest.`,
  }));

  return {
    trending,
    gaps,
    partnerPreferences: [
      {
        partnerType: 'Hiring partners',
        topics: ['Career', 'Web Dev'],
        explanation:
          'Career and applied web sessions usually offer clearer sponsor value through hiring visibility.',
      },
      {
        partnerType: 'Cloud or tooling partners',
        topics: ['DevOps', 'Open Source'],
        explanation:
          'Tooling partners align well with hands-on infrastructure and open-source formats.',
      },
    ],
  };
}

function buildPriorityRecommendations(
  typeSummaries,
  attendancePredictions,
  planningRecommendations
) {
  return typeSummaries
    .slice()
    .sort((a, b) => b.averageRegistrations - a.averageRegistrations)
    .slice(0, 5)
    .map((summary) => {
      const prediction = attendancePredictions.find((item) => item.type === summary.type);
      const planning = planningRecommendations.find((item) => item.type === summary.type);
      return {
        title: `${summary.type} events are performing strongest`,
        priority: prediction?.alert ? 'medium' : 'high',
        action: `Plan the next ${summary.type} event ${planning?.timeline || '3-5 weeks'} ahead with capacity near ${prediction?.recommendedCapacity || summary.averageRegistrations}.`,
        explanation: `${summary.eventCount} past event(s) averaged ${summary.averageRegistrations} registrations and ${summary.averageAttendanceRate || 0}% attendance.`,
      };
    });
}

export function buildEventRecommendations(rawEvents, registrationsByEvent = {}, options = {}) {
  const now = options.now || new Date();
  const events = rawEvents.map((event) =>
    getEventStats(event, registrationsByEvent[event.id] || [], now)
  );
  const completedEvents = getCompletedEvents(events, now);
  const analysisBase = completedEvents.length ? completedEvents : events;
  const typeSummaries = buildTypeSummaries(analysisBase).sort(
    (a, b) => b.averageRegistrations - a.averageRegistrations
  );
  const historicalPatterns = buildHistoricalPatterns(analysisBase, typeSummaries);
  const planningRecommendations = buildPlanningRecommendations(typeSummaries);
  const attendancePredictions = buildAttendancePredictions(typeSummaries);
  const schedulingRecommendations = buildSchedulingRecommendations(events, historicalPatterns);
  const resourceRecommendations = buildResourceRecommendations(attendancePredictions, analysisBase);
  const topicRecommendations = buildTopicRecommendations(events);
  const recommendations = buildPriorityRecommendations(
    typeSummaries,
    attendancePredictions,
    planningRecommendations
  );

  return {
    generatedAt: now.toISOString(),
    dataWindow: {
      totalEvents: events.length,
      historicalEvents: analysisBase.length,
      note:
        analysisBase.length >= 8
          ? '2+ years of event data recommended for final QA; current sample is enough for directional recommendations.'
          : 'Add more historical events and registrations to improve prediction confidence.',
    },
    recommendations,
    historicalPatterns,
    planningRecommendations,
    attendancePredictions,
    schedulingRecommendations,
    resourceRecommendations,
    topicRecommendations,
  };
}

export async function getAdminEventRecommendations() {
  const events = [];
  const limit = 500;
  let page = 1;
  let total = 0;

  do {
    const result = await eventsRepository.listAll({ page, limit });
    events.push(...result.rows);
    total = result.total;
    page += 1;
  } while (events.length < total);

  const registrationsByEvent = {};

  await Promise.all(
    events.map(async (event) => {
      registrationsByEvent[event.id] = await registrationsRepository.findByEventId(event.id);
    })
  );

  return buildEventRecommendations(events, registrationsByEvent);
}

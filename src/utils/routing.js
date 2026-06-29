import { activityPages } from '../data/activities/index';
import { events as fallbackEvents } from '../data/eventsData';

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function stateToUrl(page) {
  if (!page) return '/';
  
  switch (page.type) {
    case 'section':
      return `/${page.section.toLowerCase()}`;
    case 'activity':
      return `/activities/${encodeURIComponent(page.activityKey.toLowerCase().replace(/\s+/g, '-'))}`;
    case 'event':
      return `/events/${encodeURIComponent(page.event.id)}`;
    case 'apply':
      return '/apply';
    case 'join':
      return '/join';
    case 'gamification':
      return '/gamification';
    default:
      return '/';
  }
}

export function urlToState(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { page: null, activeTab: 'Home' };

  const [part1, part2] = parts;
  
  if (part1 === 'activities' && part2) {
    const slug = decodeURIComponent(part2).replace(/-/g, ' ');
    const key = Object.keys(activityPages).find(k => k.toLowerCase() === slug) || titleCase(slug);
    return { page: { type: 'activity', activityKey: key }, activeTab: 'Activities' };
  }

  if (part1 === 'events' && part2) {
    const id = decodeURIComponent(part2);
    // Find event in fallbackEvents
    let ev = fallbackEvents.find(e => e.id === id);
    let activityKey = ev?.activityKey || 'Insight Session';

    // If not found, search in activityPages
    if (!ev) {
      for (const [key, activity] of Object.entries(activityPages)) {
        if (activity.conductedEvents) {
          const e = activity.conductedEvents.find(e => e.id === id);
          if (e) {
            ev = e;
            activityKey = key;
            break;
          }
        }
        if (activity.upcomingEvents) {
          const e = activity.upcomingEvents.find(e => e.id === id);
          if (e) {
            ev = e;
            activityKey = key;
            break;
          }
        }
      }
    }

    if (ev) {
      return { page: { type: 'event', event: ev, activityKey }, activeTab: 'Events' };
    }
    // Fallback if event not found
    return { page: { type: 'event', event: { id } }, activeTab: 'Events' };
  }

  if (['activities', 'events', 'about', 'team', 'contact', 'dashboard'].includes(part1)) {
    const section = part1.charAt(0).toUpperCase() + part1.slice(1);
    return { page: { type: 'section', section }, activeTab: section };
  }

  if (part1 === 'apply') return { page: { type: 'apply' }, activeTab: 'Home' };
  if (part1 === 'join') return { page: { type: 'join' }, activeTab: 'Home' };
  if (part1 === 'gamification') return { page: { type: 'gamification' }, activeTab: 'Home' };

  return { page: null, activeTab: 'Home' };
}

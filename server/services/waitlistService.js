const waitlists = new Map();
const notifications = [];
const deadlines = new Map();

export const waitlistService = {
  async joinWaitlist({ eventId, userId, name }) {
    if (!waitlists.has(eventId)) {
      waitlists.set(eventId, []);
    }

    const queue = waitlists.get(eventId);

    // Prevent duplicate entries
    const existing = queue.find((user) => user.userId === userId);
    if (existing) {
      return {
        message: "User is already in the waitlist.",
        position: queue.indexOf(existing) + 1,
      };
    }

    const entry = {
      userId,
      name,
      joinedAt: new Date(),
    };

    queue.push(entry);

    return {
      eventId,
      position: queue.length,
      totalWaiting: queue.length,
    };
  },

  async getPosition(eventId, userId) {
    const queue = waitlists.get(eventId) || [];

    const index = queue.findIndex((user) => user.userId === userId);

    return {
      eventId,
      position: index >= 0 ? index + 1 : null,
      totalWaiting: queue.length,
    };
  },

  async autoEnroll(eventId) {
    const queue = waitlists.get(eventId) || [];

    if (queue.length === 0) {
      return {
        message: "No users in waitlist.",
      };
    }

    const enrolled = queue.shift();

    notifications.push({
      userId: enrolled.userId,
      name: enrolled.name,
      message: `Congratulations! You have been automatically enrolled for event ${eventId}.`,
      createdAt: new Date(),
    });

    return {
      eventId,
      enrolled,
      remaining: queue.length,
    };
  },

  async notifications() {
    return notifications;
  },

  async analytics() {
    let totalWaiting = 0;

    for (const queue of waitlists.values()) {
      totalWaiting += queue.length;
    }

    return {
      totalEvents: waitlists.size,
      totalWaiting,
      totalNotifications: notifications.length,
      deadlinesConfigured: deadlines.size,
    };
  },

  async setDeadline(eventId, deadline) {
    deadlines.set(eventId, deadline);

    return {
      eventId,
      deadline,
    };
  },
};
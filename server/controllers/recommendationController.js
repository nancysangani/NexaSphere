import { recommendationService } from '../services/recommendationService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error('[RecommendationController]', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
}

// GET /api/recommendations?userId=&limit=&page=
export const getRecommendations = wrapAsync(async (req, res) => {
  const { userId, limit = 10, page = 1 } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  const result = await recommendationService.getRecommendations(userId, {
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
  });
  res.json({ success: true, ...result });
});

// GET /api/recommendations/similar/:eventId?limit=
export const getSimilarEvents = wrapAsync(async (req, res) => {
  const { eventId } = req.params;
  const { limit = 6 } = req.query;

  const similar = await recommendationService.getSimilarEvents(eventId, {
    limit: parseInt(limit, 10),
  });
  res.json({ success: true, similar });
});

// GET /api/recommendations/trending?limit=
export const getTrendingEvents = wrapAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const trending = await recommendationService.getTrendingEvents({ limit: parseInt(limit, 10) });
  res.json({ success: true, trending });
});

// GET /api/recommendations/preferences/:userId
export const getPreferences = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const prefs = await recommendationService.getPreferences(userId);
  res.json({ success: true, preferences: prefs });
});

// PUT /api/recommendations/preferences/:userId
export const upsertPreferences = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const { interests, preferredDays } = req.body;

  if (!Array.isArray(interests)) {
    return res.status(400).json({ success: false, error: 'interests must be an array' });
  }

  const prefs = await recommendationService.upsertPreferences(userId, { interests, preferredDays });
  res.json({ success: true, preferences: prefs });
});

// POST /api/recommendations/interact
export const trackInteraction = wrapAsync(async (req, res) => {
  const { userId, eventId, type } = req.body;
  if (!userId || !eventId || !type) {
    return res
      .status(400)
      .json({ success: false, error: 'userId, eventId, and type are required' });
  }

  const interaction = await recommendationService.trackInteraction(userId, eventId, type);
  res.status(201).json({ success: true, interaction });
});

// GET /api/recommendations/interactions/:userId
export const getInteractions = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  const interactions = await recommendationService.getInteractions(userId);
  res.json({ success: true, interactions });
});

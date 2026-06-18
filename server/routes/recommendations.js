import express from 'express';
import {
  getRecommendations,
  getSimilarEvents,
  getTrendingEvents,
  getPreferences,
  upsertPreferences,
  trackInteraction,
  getInteractions,
} from '../controllers/recommendationController.js';

const router = express.Router();

// Personalised recommendations for a user
router.get('/', getRecommendations);

// Similar events to a given event
router.get('/similar/:eventId', getSimilarEvents);

// Trending events (last 7 days by interaction count)
router.get('/trending', getTrendingEvents);

// User preference management
router.get('/preferences/:userId', getPreferences);
router.put('/preferences/:userId', upsertPreferences);

// Interaction tracking (viewed / registered / attended / liked)
router.post('/interact', trackInteraction);
router.get('/interactions/:userId', getInteractions);

export default router;

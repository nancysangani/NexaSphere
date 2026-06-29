const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// POST route to handle batch event tracking
router.post('/event', analyticsController.trackEvents);

module.exports = router;

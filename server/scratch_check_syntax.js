process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0';
process.env.DATABASE_URL = 'postgresql://localhost/dummy_test_db';

const files = [
  './config/appContext.js',
  './observability/index.js',
  './utils/logContext.js',
  './observability/tracing.js',
  './middleware/adminAuthMiddleware.js',
  './routes/analytics.js',
  './routes/api.js',
  './config/socket.js',
  './routes/adminStream.js',
  './routes/documentation.js',
  './routes/monitoring.js',
  './routes/health.js',
  './routes/coreTeam.js',
  './routes/forms.js',
  './routes/portfolio.js',
  './routes/portfolioExport.js',
  './routes/notifications.js',
  './routes/admin.js',
  './routes/announcements.js',
  './routes/bulk.js',
  './utils/envValidator.js',
  './middleware/performanceMonitor.js',
  './middleware/enhancedTracingMiddleware.js',
  './middleware/errorHandler.js',
  './repositories/notificationAnalyticsRepository.js',
  './utils/sentry.js',
  './middleware/rateLimiter.js',
  './middleware/authRateLimiter.js',
  './repositories/portfolioRepository.js',
  './validators/portfolioSchemas.js',
  './controllers/searchController.js',
  './utils/circuitBreaker.js',
  './utils/publicAppUrl.js',
  './controllers/eventsController.js',
  './controllers/activityEventsController.js',
  './controllers/streamController.js',
  './controllers/coreTeamController.js',
  './services/coreTeamService.js',
  './storage/supabaseClient.js',
  './config/studentOAuth.js',
  './repositories/studentUsersRepository.js',
  './controllers/studentAuthController.js',
  './controllers/forumController.js',
  './middleware/studentAuthMiddleware.js',
  './controllers/mentorshipController.js',
  './middleware/xssSanitizer.js',
  './middleware/tierRateLimiter.js',
  './middleware/csrfMiddleware.js',
  './routes/sync.js',
  './routes/learningPaths.js',
  './services/learningPathService.js',
  './controllers/resourcesController.js',
  './controllers/backupController.js',
  './routes/scheduledTasks.js',
  './routes/financials.js',
  './services/schedulerService.js',
  './routes/feedbackRoutes.js'
];

async function check() {
  for (const file of files) {
    try {
      console.log('Importing:', file);
      await import(file);
    } catch (err) {
      console.error('FAILED to import:', file);
      console.error(err);
      process.exit(1);
    }
  }
  console.log('All imports succeeded!');
}

check();

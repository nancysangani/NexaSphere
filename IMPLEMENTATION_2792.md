# API Rate Limiting Middleware - Implementation

## Overview

Implement rate limiting middleware to protect NexaSphere APIs from abuse and ensure fair resource distribution among users.

## Architecture

### Rate Limiting Strategy

- Token bucket algorithm for smooth rate limiting
- Per-user and per-IP rate limits
- Tiered limits: free/basic/premium users
- Configurable limits per endpoint

### Implementation Components

1. **Rate Limiter Middleware** (`server/middleware/rateLimiter.js`)
   - Extract user identity from request (user_id or IP)
   - Check quota against limit
   - Return 429 Too Many Requests if exceeded
   - Provide retry-after headers

2. **Rate Limit Store** (`server/services/rateLimitStore.js`)
   - In-memory store for development
   - Redis store for production
   - Atomic operations for counter updates
   - Configurable TTL for quota resets

3. **Configuration** (`server/config/rateLimits.js`)
   - API endpoint rate limits
   - User tier configurations
   - Grace periods and burst allowances

### Features

✅ Per-user rate limiting based on authentication
✅ Per-IP rate limiting for unauthenticated requests
✅ Different limits for different user tiers
✅ Endpoint-specific rate limit configurations
✅ Rate limit headers (X-RateLimit-\*) in responses
✅ Retry-After headers on 429 responses
✅ Admin bypass for internal requests
✅ Distributed rate limiting with Redis support

### Endpoints with Rate Limiting

- Complaint creation: 10 per hour per user
- Event creation: 20 per hour per user
- File uploads: 50 per day per user
- Authentication attempts: 5 per 15 minutes per IP
- Search/listing: 100 per hour per user
- Public APIs: 100 per hour per IP

## Security Measures

- Prevent brute force attacks on authentication
- Protect against API scraping
- Ensure fair resource distribution
- Prevent DDoS-style abuses
- Monitor for suspicious patterns

## Testing

- Unit tests for rate limit algorithms
- Integration tests with different user tiers
- Load tests for concurrent requests
- Redis failover scenarios
- Rate limit reset timing verification

## Configuration

```javascript
RATE_LIMITS = {
  complaint_create: { free: 10, basic: 50, premium: 200, period: 3600 },
  event_create: { free: 20, basic: 100, premium: 500, period: 3600 },
  file_upload: { free: 5, basic: 50, premium: 200, period: 86400 },
  auth_attempt: { free: 5, basic: 10, premium: 20, period: 900 },
};
```

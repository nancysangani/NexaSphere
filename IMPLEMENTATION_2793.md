# Pagination Implementation for Event and Complaint Listings - Implementation

## Overview

Add pagination support to NexaSphere's event and complaint listing endpoints to improve performance and user experience with large datasets.

## Architecture

### Pagination Strategy

- Offset-based pagination for simplicity
- Optional cursor-based pagination for performance
- Configurable page sizes (10, 25, 50 items)
- Total count calculation for result set sizing

### API Endpoints with Pagination

1. **Events Listing** (`GET /api/events`)
   - Query parameters: page, limit, sort, filter
   - Response includes: items, total_count, page, total_pages, has_next

2. **Complaints Listing** (`GET /api/complaints`)
   - Query parameters: page, limit, sort, status_filter
   - Response includes: items, total_count, page, total_pages, has_next

### Implementation Components

1. **Pagination Middleware** (`server/middleware/pagination.js`)
   - Parse and validate pagination parameters
   - Set default values (limit=20, page=1)
   - Validate limits (min=1, max=100)
   - Attach pagination context to request

2. **Database Query Helper** (`server/services/paginationHelper.js`)
   - Calculate offset from page and limit
   - Execute paginated queries
   - Return paginated result with metadata
   - Support for sorting and filtering

3. **Response Formatter** (`server/utils/paginationFormatter.js`)
   - Format paginated response consistently
   - Include navigation information
   - Add total count and page metadata

### Features

✅ Offset-based pagination for GET requests
✅ Configurable page sizes (10-100 items)
✅ Total count in response
✅ Previous/next page information
✅ Sorting support (created_at, updated_at, popularity)
✅ Filtering by status, category, user
✅ Consistent API response format
✅ Performance optimized for large datasets

### Response Format

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current_page": 2,
      "per_page": 20,
      "total_items": 150,
      "total_pages": 8,
      "has_previous": true,
      "has_next": true
    }
  }
}
```

## Performance Optimizations

- Database query optimization with proper indexes
- Caching of count queries when appropriate
- Lazy loading of large result sets
- Query execution time monitoring

## Testing

- Unit tests for pagination calculations
- Integration tests with various filters
- Performance tests with large datasets
- Edge case testing (page beyond total, invalid limits)

## Database Considerations

- Ensure proper indexes on sort columns
- Use LIMIT and OFFSET in SQL queries
- Optimize COUNT(\*) queries with caching
- Monitor query performance with large datasets

## Frontend Integration

- Use page/limit query parameters
- Display current page information
- Show total results count
- Enable next/previous navigation
- Implement infinite scroll or pagination UI

Fixes #2793

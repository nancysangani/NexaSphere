# File Upload Validation with Type, Size, and Dimension Checks - Implementation

## Overview

Implement comprehensive file upload validation to prevent security vulnerabilities and ensure data integrity for image uploads in NexaSphere.

## Validation Components

### 1. File Type Validation

**Magic Byte Detection** (`server/validators/fileValidator.js`)

- Verify actual file type using magic bytes
- Prevent file type spoofing (rename .exe to .jpg)
- Support file formats: JPEG, PNG, GIF, WebP
- Reject all other formats

**MIME Type Verification**

- Check Content-Type header
- Validate against declared extension
- Cross-validate with magic bytes

### 2. File Size Validation

**Maximum Size Limits**

- Individual file: 5 MB maximum
- Total per user per day: 50 MB
- Rate limiting: 10 uploads per hour

**Minimum Size Limits**

- Minimum: 1 KB (prevent empty files)
- Detect and reject placeholder files

### 3. Image Dimension Validation

**Dimension Constraints**

- Minimum: 100x100 pixels
- Maximum: 4000x4000 pixels
- Aspect ratio validation (not extreme)

**Resolution Check**

- Prevent extremely high-res images
- Prevent 1-pixel images
- Validate proportional dimensions

### 4. Content Scanning

**Malware Detection**

- Scan file content for embedded code
- Detect polyglot files (multiple formats)
- Check for suspicious headers

**Metadata Validation**

- Strip EXIF data for privacy
- Remove embedded scripts
- Clean file metadata

## Implementation Architecture

```
FileValidator
├── Magic Byte Check
│   ├── JPEG (FF D8 FF)
│   ├── PNG (89 50 4E 47)
│   ├── GIF (47 49 46)
│   └── WebP (52 49 46 46)
├── Size Validation
│   ├── Individual file check
│   ├── User quota check
│   └── Rate limiting
├── Dimension Check
│   ├── Parse image headers
│   ├── Validate width/height
│   └── Check aspect ratio
└── Content Scanning
    ├── Embedded code detection
    ├── Polyglot file detection
    └── Metadata stripping
```

### API Endpoint

**POST /api/files/upload**

```javascript
request: {
  file: multipart file,
  description: string (optional),
  category: string (optional)
}

response: {
  success: true,
  file_id: uuid,
  filename: string,
  size: number,
  dimensions: { width, height },
  url: string
}
```

### Error Responses

- 400: Invalid file type
- 413: File too large
- 422: Invalid dimensions
- 429: Rate limit exceeded
- 500: Server error during validation

## Validation Rules

| Rule          | Value   | Error Code |
| ------------- | ------- | ---------- |
| Max file size | 5 MB    | 413        |
| Min file size | 1 KB    | 400        |
| Max width     | 4000 px | 422        |
| Max height    | 4000 px | 422        |
| Min width     | 100 px  | 422        |
| Min height    | 100 px  | 422        |
| Daily quota   | 50 MB   | 429        |
| Upload rate   | 10/hour | 429        |

## Security Features

✅ Magic byte validation to prevent spoofing
✅ Content-Type verification
✅ EXIF data stripping for privacy
✅ Embedded code detection
✅ File size and dimension limits
✅ User quota management
✅ Rate limiting per user
✅ Virus/malware scanning integration

## Testing Plan

- Unit tests for each validation rule
- Magic byte detection with edge cases
- Dimension validation boundary testing
- Quota enforcement testing
- Rate limit testing
- Security testing with malicious files
- Performance testing with large uploads
- Concurrent upload handling

## Performance Optimizations

- Stream-based file processing
- Lazy header parsing (don't read entire file)
- Efficient byte comparison
- Asynchronous validation
- Progress tracking for large files

## Dependencies

- sharp: Image dimension detection
- file-type: Magic byte detection
- multer: File upload handling
- piping: Stream processing for efficiency

## Configuration

```javascript
FILE_LIMITS = {
  max_file_size: 5 * 1024 * 1024, // 5 MB
  min_file_size: 1024, // 1 KB
  max_dimension: 4000, // 4000 px
  min_dimension: 100, // 100 px
  daily_quota: 50 * 1024 * 1024, // 50 MB
  rate_limit: 10, // uploads per hour
  allowed_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};
```

Fixes #2795

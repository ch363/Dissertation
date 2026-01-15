# Security Hardening Improvements

This document summarizes the security improvements implemented to harden the Fluentia application following OWASP best practices.

## Summary

The application has been enhanced with comprehensive security measures including:
1. **Enhanced Rate Limiting** - IP + user-based rate limiting on all public endpoints
2. **Strict Input Validation & Sanitization** - Schema-based validation with length limits and sanitization
3. **Secure API Key Handling** - All keys moved to environment variables, no hard-coded secrets
4. **Security Headers** - OWASP recommended HTTP security headers
5. **Production Hardening** - Swagger disabled in production, error messages limited

## 1. Rate Limiting (IP + User-Based)

### Implementation
- **Enhanced Throttler Guard** (`backend/src/common/guards/enhanced-throttler.guard.ts`)
  - Tracks rate limits by both IP address and user ID
  - Public endpoints: Rate limited by IP address
  - Authenticated endpoints: Rate limited by both IP and user ID (prevents bypassing limits)
  - Handles proxies/load balancers (X-Forwarded-For, X-Real-IP headers)

### Configuration
- **Default Limits:**
  - Production: 100 requests/minute (IP-based)
  - Development: 1000 requests/minute (IP-based)
  - User-based limits: Configurable via `THROTTLE_USER_LIMIT` (defaults to same as IP limit)

- **Environment Variables:**
  ```bash
  THROTTLE_TTL=60000              # Time window in milliseconds (default: 1 minute)
  THROTTLE_LIMIT=100              # Max requests per window for IP-based (default: 100 prod, 1000 dev)
  THROTTLE_USER_LIMIT=50          # Max requests per window for user-based (optional, defaults to THROTTLE_LIMIT)
  ```

### Graceful 429 Responses
- Standard HTTP 429 (Too Many Requests) status code
- Proper headers (RFC 6585):
  - `Retry-After`: Seconds until rate limit resets
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests (0 when exceeded)
  - `X-RateLimit-Reset`: ISO timestamp when limit resets
- Clear error messages with retry information

### Exclusions
- Health check endpoints (`/health`, `/health/db`) are excluded from rate limiting

## 2. Input Validation & Sanitization

### Implementation
- **Sanitization Utilities** (`backend/src/common/utils/sanitize.util.ts`)
  - `sanitizeString()`: Removes HTML tags, dangerous characters, prevents XSS
  - `sanitizeUrl()`: Validates and sanitizes URLs (HTTP/HTTPS only)
  - `sanitizeBase64()`: Validates base64 format and enforces size limits
  - `sanitizeUuid()`: Validates UUID v4 format
  - `sanitizeInt()`: Validates and bounds-checks integers
  - `sanitizeEnum()`: Validates enum values against allowed list

### Enhanced DTOs
All DTOs have been enhanced with:
- **Length Limits**: Maximum character limits on all string fields
- **Type Validation**: Strict type checking (UUIDs, enums, integers)
- **Sanitization**: Automatic sanitization via `@Transform()` decorator
- **Range Validation**: Min/max bounds on numeric fields

#### Updated DTOs:
- `CreateModuleDto` / `UpdateModuleDto`
- `CreateLessonDto` / `UpdateLessonDto`
- `CreateTeachingDto` / `UpdateTeachingDto`
- `CreateQuestionDto`
- `UpdateUserDto`
- `QuestionAttemptDto`
- `ValidateAnswerDto`
- `ValidatePronunciationDto`
- `SearchQueryDto`
- `DeliveryMethodScoreDto`
- `KnowledgeLevelProgressDto`
- `UpdateDeliveryMethodsDto`

### Validation Features
- **Whitelist Mode**: Only expected fields are accepted (rejects unexpected fields)
- **Type Transformation**: Automatic type conversion with validation
- **Length Limits**: Prevents DoS via oversized inputs
- **XSS Prevention**: HTML/JavaScript stripped from all string inputs
- **Injection Prevention**: Dangerous characters removed (semicolons, quotes, etc.)

### Example Validation Rules:
```typescript
// Title: Max 200 chars, sanitized
@MaxLength(200)
@Transform(({ value }) => sanitizeString(value, 200))

// URL: Max 2048 chars, HTTP/HTTPS only, validated
@MaxLength(2048)
@Matches(/^https?:\/\/.+/)
@Transform(({ value }) => sanitizeUrl(value))

// UUID: Validated UUID v4 format
@IsUUID(4)
@Transform(({ value }) => sanitizeUuid(value))

// Integer: Bounded, validated
@IsInt()
@Min(0)
@Max(100)
@Transform(({ value }) => sanitizeInt(value, 0, 100))
```

## 3. Secure API Key Handling

### Audit Results
✅ **No hard-coded API keys found**
✅ **All secrets use environment variables**
✅ **Proper separation of public vs private keys**

### Backend API Keys
All backend secrets are loaded from environment variables:

- **Supabase:**
  - `SUPABASE_URL`: Project URL
  - `SUPABASE_JWT_SECRET`: JWT secret for token verification (required)
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (optional, fallback)
  - `SUPABASE_ANON_KEY`: Anonymous key (optional, client-side only)

- **Database:**
  - `DATABASE_URL`: PostgreSQL connection string
  - `DIRECT_URL`: Direct database URL (optional)

- **Google Cloud Speech API:**
  - `GOOGLE_APPLICATION_CREDENTIALS`: Service account credentials file path
  - Uses standard Google Cloud authentication (no hard-coded keys)

### Mobile App Keys
- **Supabase Anonymous Key**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - ✅ This is **intentionally public** (Supabase anon key is meant for client-side use)
  - ✅ Protected by Row Level Security (RLS) policies in Supabase
  - ✅ Loaded from environment variables, not hard-coded

### Security Best Practices
1. **Environment Variable Validation**: All required env vars validated at startup via Joi schema
2. **No Secrets in Code**: Zero hard-coded API keys or secrets
3. **Proper Key Rotation**: All keys can be rotated via environment variables
4. **Client-Side Keys**: Only public keys exposed to client (Supabase anon key)
5. **Server-Side Secrets**: All sensitive keys remain server-side only

### Key Rotation
To rotate API keys:
1. Update the key in your environment variables (`.env` file or deployment config)
2. Restart the application
3. No code changes required

## Security Headers & Configuration

### CORS Configuration
- Configurable origins via `CORS_ORIGIN` environment variable
- Default: Local development origins only
- Credentials enabled for authenticated requests

### Global Validation Pipe
- **Whitelist**: Only expected fields accepted
- **Forbid Non-Whitelisted**: Rejects unexpected fields
- **Transform**: Automatic type conversion with validation

## Testing Security

### Rate Limiting
Test rate limiting by making rapid requests:
```bash
# Should return 429 after limit exceeded
for i in {1..101}; do curl http://localhost:3000/modules; done
```

### Input Validation
Test validation by sending invalid data:
```bash
# Should return 400 Bad Request
curl -X POST http://localhost:3000/modules \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(1)</script>", "description": "A".repeat(10000)}'
```

## Security Headers

The application now includes OWASP-recommended security headers:

```typescript
// Added in main.ts
X-Frame-Options: DENY                    // Prevent clickjacking
X-Content-Type-Options: nosniff          // Prevent MIME sniffing
X-XSS-Protection: 1; mode=block          // Enable browser XSS filter
Referrer-Policy: strict-origin-when-cross-origin  // Control referrer
Content-Security-Policy: default-src 'self'       // Basic CSP
Cache-Control: no-store                  // Prevent caching sensitive data (on /me, /progress)
```

## Production Hardening

### Swagger Documentation
- **Disabled in production** by default (prevents API schema exposure)
- Enable via `ENABLE_SWAGGER=true` if needed
- Security recommendation: Keep disabled unless required for internal use

### Validation Error Messages
- **Detailed errors disabled in production** (`disableErrorMessages: true`)
- Prevents information leakage about validation logic
- Development mode still shows full error details for debugging

### Sensitive Endpoint Caching
- `/me/*` and `/progress/*` endpoints set `Cache-Control: no-store`
- Prevents caching of user-specific data in proxies or browsers

## OWASP Compliance

### OWASP Top 10 (2021) Coverage:
- ✅ **A01:2021 – Broken Access Control**: User-based rate limiting, JWT validation, user-scoped data
- ✅ **A02:2021 – Cryptographic Failures**: All secrets in environment variables, JWT verification
- ✅ **A03:2021 – Injection**: Input sanitization, parameterized queries (Prisma), XSS prevention
- ✅ **A04:2021 – Insecure Design**: Rate limiting, validation-first architecture, defense in depth
- ✅ **A05:2021 – Security Misconfiguration**: Proper CORS, security headers, Swagger disabled in prod
- ✅ **A06:2021 – Vulnerable Components**: Using latest package versions
- ✅ **A07:2021 – Identification and Authentication Failures**: JWT validation, Supabase Auth
- ✅ **A08:2021 – Software and Data Integrity Failures**: Input validation, type checking
- ✅ **A09:2021 – Security Logging and Monitoring**: Request logging middleware
- ✅ **A10:2021 – Server-Side Request Forgery**: URL validation (HTTP/HTTPS only)

## Recommendations for Production

1. **Rate Limiting:**
   - Consider using Redis for distributed rate limiting in multi-instance deployments
   - Adjust `THROTTLE_LIMIT` and `THROTTLE_USER_LIMIT` based on your traffic patterns
   - Monitor rate limit hits to identify potential abuse

2. **Input Validation:**
   - Review length limits based on your actual use cases
   - Consider adding more specific validation for business logic
   - Monitor validation failures to identify attack attempts

3. **API Keys:**
   - Rotate keys regularly (quarterly recommended)
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault) in production
   - Never commit `.env` files to version control
   - Use different keys for development/staging/production

4. **Monitoring:**
   - Set up alerts for rate limit violations
   - Monitor validation error rates
   - Track authentication failures
   - Log security events for audit

## Files Modified

### New Files:
- `backend/src/common/guards/enhanced-throttler.guard.ts` - Enhanced rate limiting guard
- `backend/src/common/utils/sanitize.util.ts` - Input sanitization utilities
- `backend/src/me/dto/ensure-profile.dto.ts` - Profile ensure DTO with validation
- `backend/src/me/dto/upload-avatar.dto.ts` - Avatar upload DTO with URL validation
- `SECURITY_IMPROVEMENTS.md` - This document

### Modified Files:
- `backend/src/main.ts` - Added security headers, enhanced validation pipe config
- `backend/src/app.module.ts` - Updated to use EnhancedThrottlerGuard
- `backend/src/config/configuration.ts` - Added user-based rate limit config
- `backend/src/config/env.validation.ts` - Added rate limit env var validation
- `backend/src/common/swagger/swagger.config.ts` - Disabled Swagger in production
- `backend/src/me/me.controller.ts` - Use proper DTOs for all endpoints
- `backend/src/onboarding/dto/onboarding.dto.ts` - Validate onboarding answers structure
- All DTOs in `backend/src/*/dto/*.dto.ts` - Enhanced with validation and sanitization

## Conclusion

The application now follows OWASP best practices with:
- ✅ Comprehensive rate limiting (IP + user-based)
- ✅ Strict input validation and sanitization
- ✅ Secure API key handling (no hard-coded secrets)
- ✅ Graceful error handling (429 responses)
- ✅ Clear security documentation

All existing functionality has been preserved while significantly improving security posture.

# Fluentia Architecture Documentation

This document provides a comprehensive overview of the architecture for both the mobile application and backend API.

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Mobile Architecture](#mobile-architecture)
4. [Data Flow](#data-flow)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Deployment Considerations](#deployment-considerations)

## System Overview

Fluentia is a distributed language learning platform with a clear separation between the mobile client and backend services:

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐         ┌──────────────┐
│  Backend API    │─────────▶│  PostgreSQL  │
│  (NestJS)       │  Prisma │  Database    │
└─────────────────┘         └──────────────┘
```

The mobile app communicates with Supabase (which may proxy to the NestJS backend) for authentication and data access, while the NestJS backend provides the core API for learning content and progress tracking.

## Backend Architecture

### Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL
- **ORM**: Prisma 7.x
- **Runtime**: Node.js

### Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point with validation pipes
│   ├── app.module.ts           # Root module (imports all feature modules)
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   ├── common/                 # Shared guards, decorators, filters
│   │   ├── guards/
│   │   │   └── supabase-jwt.guard.ts   # JWT verification guard
│   │   ├── decorators/
│   │   │   └── user.decorator.ts       # @UserId() decorator
│   │   └── filters/                     # Global exception filters
│   ├── auth/                   # Authentication module
│   │   ├── auth.module.ts      # Auth module configuration
│   │   ├── supabase.strategy.ts        # Passport JWT strategy
│   │   └── supabase-jwt.service.ts     # JWT validation service
│   ├── users/                  # User management module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts # /me endpoints
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── modules/                # Module content CRUD
│   ├── lessons/                # Lesson content CRUD
│   ├── teachings/              # Teaching content CRUD
│   ├── questions/              # Question content CRUD + delivery methods
│   ├── progress/               # Progress tracking module
│   │   ├── progress.module.ts
│   │   ├── progress.controller.ts
│   │   ├── progress.service.ts
│   │   └── dto/
│   ├── learn/                  # Learning orchestration
│   │   ├── learn.module.ts
│   │   ├── learn.controller.ts # /learn/next, /learn/suggestions
│   │   └── learn.service.ts
│   └── prisma/
│       ├── prisma.module.ts    # Prisma module configuration
│       └── prisma.service.ts   # Prisma service with connection pooling
├── prisma/
│   └── schema.prisma           # Database schema definition
├── test/                       # E2E tests
└── package.json
```

### Architecture Patterns

#### 1. Modular Architecture
NestJS uses a modular architecture where features are organized into modules. The root `AppModule` imports the `PrismaModule` which provides database access throughout the application.

#### 2. Service Layer Pattern
Business logic is encapsulated in services (e.g., `AppService`, `PrismaService`). Controllers handle HTTP requests and delegate to services.

#### 3. Dependency Injection
NestJS uses dependency injection for loose coupling. Services are injected into controllers and other services via constructors.

### Database Connection

The backend uses Prisma with a PostgreSQL connection pool for efficient database access:

```typescript
// PrismaService uses connection pooling
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
super({ adapter });
```

**Key Features:**
- Connection pooling for performance
- Lifecycle hooks (`onModuleInit`, `onModuleDestroy`) for proper connection management
- Type-safe database access via Prisma Client

### Key Design Principles

1. **User Scoping**: All progress operations are automatically scoped to the authenticated user. The user ID is extracted from the JWT token (`sub` claim) and never accepted from client requests.

2. **Append-Only Logs**: `UserQuestionPerformance` is an immutable append-only log. Each attempt creates a new record; historical data is never modified.

3. **Idempotency**: Progress operations (like starting a lesson or completing a teaching) are idempotent. Calling them multiple times produces the same result without side effects.

4. **Transactional Integrity**: Multi-write operations (e.g., completing a teaching and updating lesson progress) use Prisma transactions to ensure atomicity.

5. **Business-Layer Provisioning**: User provisioning happens at the business layer via `GET /me`, not through database triggers. This ensures the backend has full control over user creation.

6. **Cascade Deletes**: Content hierarchy (Module → Lesson → Teaching → Question) uses cascade deletes, ensuring data consistency when content is removed.

### API Design Principles

1. **RESTful**: Follows REST conventions for resource access
2. **Type Safety**: Full TypeScript coverage with Prisma-generated types
3. **Error Handling**: Proper HTTP status codes (401 for auth, 404 for not found)
4. **Validation**: Input validation with class-validator and class-transformer
5. **Data Ownership**: All progress operations scoped to authenticated user (never accepts userId from client)
6. **Idempotency**: Progress operations are idempotent (safe to retry)
7. **Transactional Integrity**: Multi-write operations use Prisma transactions
8. **Append-Only Logs**: Performance logs are immutable (never updated, always inserted)

## Mobile Architecture

### Technology Stack

- **Framework**: React Native 0.74.x
- **Build System**: Expo 51.x
- **Routing**: Expo Router 3.x
- **Backend**: Supabase Client
- **Language**: TypeScript 5.x
- **State Management**: React Context API

### Project Structure

```
mobile/
├── app/                        # Expo Router routes (file-based routing)
│   ├── (auth)/                 # Authentication routes
│   ├── (onboarding)/           # Onboarding flow routes
│   ├── (tabs)/                 # Main tab navigation
│   ├── api/                    # API/data access layer
│   └── _layout.tsx             # Root layout
├── src/
│   ├── features/               # Feature modules (vertical slices)
│   │   ├── auth/               # Authentication feature
│   │   ├── onboarding/         # Onboarding feature
│   │   ├── home/               # Home screen feature
│   │   ├── learn/              # Learning feature
│   │   ├── course/             # Course feature
│   │   ├── profile/            # Profile feature
│   │   └── settings/           # Settings feature
│   ├── services/               # Cross-cutting services
│   │   ├── auth/               # Auth provider
│   │   ├── theme/              # Theme provider
│   │   ├── navigation/         # Navigation utilities
│   │   ├── preferences/        # User preferences
│   │   └── tts/                # Text-to-speech
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Shared React hooks
│   └── types/                  # TypeScript type definitions
└── assets/                     # Images, fonts, etc.
```

### Architecture Patterns

#### 1. Feature-First Architecture
The mobile app uses a feature-first (vertical slice) architecture where each feature is self-contained:

```
features/
└── auth/
    ├── screens/        # UI screens
    ├── components/     # Feature-specific components
    ├── hooks/          # Feature-specific hooks
    ├── api.ts          # Feature facade (public API)
    └── types.ts        # Feature-specific types
```

**Benefits:**
- Clear feature boundaries
- Easier to locate code
- Better testability
- Reduced coupling between features

#### 2. Facade Pattern
Each feature exposes a facade (`api.ts`) that provides a clean interface for other parts of the app:

```typescript
// features/auth/api.ts
export { signUpWithEmail, signInWithEmail, getCurrentUser } from '@/app/api/auth';
```

This decouples UI from implementation details and makes testing easier.

#### 3. Service Layer
Cross-cutting concerns are handled by services:
- **AuthProvider**: Manages authentication state
- **ThemeProvider**: Manages theme (light/dark mode)
- **RouteGuard**: Protects routes based on auth state
- **SupabaseConfigGate**: Ensures Supabase is configured before rendering

#### 4. File-Based Routing
Expo Router uses file-based routing where the file structure in `app/` determines the navigation structure:

```
app/
├── index.tsx                    # Landing screen
├── (auth)/
│   ├── sign-in.tsx             # /sign-in
│   └── sign-up.tsx              # /sign-up
└── (tabs)/
    ├── home/
    │   └── index.tsx            # /home
    └── learn/
        └── index.tsx            # /learn
```

### Data Flow

```
┌─────────────┐
│   Screen    │
│  Component  │
└──────┬──────┘
       │
       │ Uses
       ▼
┌─────────────┐
│   Feature   │
│   Facade    │
│  (api.ts)   │
└──────┬──────┘
       │
       │ Calls
       ▼
┌─────────────┐
│  app/api/   │
│  (Supabase) │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│  Supabase   │
│   Backend   │
└─────────────┘
```

### State Management

The app uses React Context API for global state:

1. **AuthProvider**: Manages user session and authentication state
2. **ThemeProvider**: Manages theme preferences
3. **OnboardingProvider**: Manages onboarding completion state

Local state is managed with React hooks (`useState`, `useEffect`).

## Data Flow

### User Authentication Flow

```
1. User enters credentials
   ↓
2. Mobile app calls Supabase auth API
   ↓
3. Supabase validates and returns session
   ↓
4. AuthProvider updates context
   ↓
5. RouteGuard redirects based on auth state
```

### Learning Content Flow

```
1. User navigates to lesson
   ↓
2. Screen component calls feature facade
   ↓
3. Facade calls app/api/content
   ↓
4. API fetches from Supabase/Backend
   ↓
5. Data flows back through layers
   ↓
6. UI renders content
```

### Progress Tracking Flow

```
1. User completes question/teaching
   ↓
2. Mobile app records performance
   ↓
3. Data sent to backend via API
   ↓
4. Backend updates database (Prisma)
   ↓
5. Progress metrics calculated
   ↓
6. UI updates to reflect progress
```

## Database Design

### Entity Relationship Overview

```
Module (1) ──< (many) Lesson
Lesson (1) ──< (many) Teaching
Teaching (1) ──< (many) Question
Question (many) ──< (many) QuestionDeliveryMethod

User (1) ──< (many) UserLesson
User (1) ──< (many) UserTeachingCompleted
User (1) ──< (many) UserQuestionPerformance
User (1) ──< (many) UserDeliveryMethodScore
User (1) ──< (many) UserKnowledgeLevelProgress
```

### Key Models

#### Module
Top-level learning units containing multiple lessons.

#### Lesson
Individual lessons within a module. Contains teachings and tracks user progress.

#### Teaching
Learning content items with:
- Knowledge level (A1-C2)
- User language string
- Learning language string
- Audio URL for pronunciation
- Tips and emoji

#### Question
Practice questions linked to teachings. Can have multiple delivery methods.

#### User
User account with:
- Knowledge points
- Current knowledge level
- Preferred delivery method

#### UserQuestionPerformance
Tracks detailed performance metrics:
- Score
- Time to complete
- Percentage accuracy
- Attempts
- Spaced repetition scheduling (next review due)

### Database Features

1. **UUID Primary Keys**: All entities use UUIDs for better distribution
2. **Timestamps**: Automatic `created_at` and `updated_at` tracking
3. **Indexes**: Strategic indexes on foreign keys and frequently queried fields
4. **Enums**: Type-safe enums for knowledge levels and delivery methods
5. **Relations**: Proper foreign key relationships with cascade options

## API Design

### Backend API (NestJS)

The backend provides a comprehensive REST API organized into feature modules:

#### Identity & User Management
```
GET  /me                    # User provisioning (upserts user from JWT)
PATCH /me                    # Update user preferences
GET  /me/dashboard          # Dashboard stats (due reviews, active lessons, XP)
GET  /me/lessons            # User's started lessons with progress
```

#### Content Management (Public reads, authenticated writes)
```
# Modules
GET    /modules                    # List all modules
POST   /modules                    # Create module (admin)
GET    /modules/:id                # Get module details
PATCH  /modules/:id                # Update module (admin)
DELETE /modules/:id                # Delete module (admin)
GET    /modules/:id/lessons        # Get lessons for module

# Lessons
GET    /lessons?moduleId=          # List lessons (filtered by module)
POST   /lessons                    # Create lesson (admin)
GET    /lessons/:id                # Get lesson details
PATCH  /lessons/:id                # Update lesson (admin)
DELETE /lessons/:id                # Delete lesson (admin)
GET    /lessons/:id/teachings      # Get teachings for lesson

# Teachings
GET    /teachings?lessonId=        # List teachings (filtered by lesson)
POST   /teachings                  # Create teaching (admin)
GET    /teachings/:id              # Get teaching details
PATCH  /teachings/:id              # Update teaching (admin)
DELETE /teachings/:id              # Delete teaching (admin)
GET    /teachings/:id/questions    # Get questions for teaching

# Questions
GET    /questions?teachingId=      # List questions (filtered by teaching)
POST   /questions                  # Create question (admin)
GET    /questions/:id              # Get question with delivery methods
DELETE /questions/:id              # Delete question (admin)
PUT    /questions/:id/delivery-methods  # Replace delivery methods (admin)
```

#### Progress Tracking (All authenticated)
```
POST /progress/lessons/:lessonId/start        # Start/update lesson engagement
GET  /progress/lessons                        # Get user's lesson progress
POST /progress/teachings/:teachingId/complete # Mark teaching completed
POST /progress/questions/:questionId/attempt # Record question attempt
GET  /progress/reviews/due                   # Get all due reviews
GET  /progress/reviews/due/latest            # Get deduped due reviews
POST /progress/delivery-method/:method/score  # Update delivery method score
POST /progress/knowledge-level-progress       # Record XP progression
```

#### Learning Orchestration (Authenticated)
```
GET /learn/next?lessonId=<uuid>              # Get next item in lesson
GET /learn/suggestions?currentLessonId=&moduleId=&limit=  # Get suggestions
```

**Key Features:**
- All authenticated endpoints verify Supabase JWT tokens
- User ID is extracted from JWT `sub` claim, never from request body
- Content endpoints are public for reads, require auth for writes
- Progress endpoints are fully authenticated and user-scoped
- Learning endpoints provide intelligent content sequencing

### Mobile API Layer (Supabase)

The mobile app uses Supabase client for data access:

```typescript
// app/api/content/index.ts
export async function fetchSentences() {
  const { data } = await supabase.from('sentences').select('*');
  return data;
}
```

## Authentication & Authorization

### Authentication Flow

Fluentia uses **Supabase Auth** as the single identity provider for both mobile and backend:

```
┌─────────────┐
│ Mobile App  │
│  (Expo)     │
└──────┬──────┘
       │
       │ 1. User signs in
       ▼
┌─────────────┐
│  Supabase   │
│    Auth     │
└──────┬──────┘
       │
       │ 2. Returns JWT token
       ▼
┌─────────────┐
│ Mobile App  │
│ Stores JWT  │
└──────┬──────┘
       │
       │ 3. API requests with
       │    Authorization: Bearer <token>
       ▼
┌─────────────┐
│  Backend    │
│  (NestJS)   │
└──────┬──────┘
       │
       │ 4. SupabaseJwtGuard
       │    verifies JWT
       ▼
┌─────────────┐
│  Extracts   │
│  user.id    │
│  from 'sub' │
└─────────────┘
```

### Mobile App (Supabase Auth)

- Email/password authentication via Supabase
- Session management via Supabase client
- Protected routes via `RouteGuard`
- Deep linking for password reset
- JWT tokens stored securely in app state

### Backend (NestJS)

- **JWT Verification**: `SupabaseJwtGuard` (in `common/guards/supabase-jwt.guard.ts`) validates Supabase JWT tokens on every authenticated endpoint
- **Token Extraction**: Uses Passport JWT strategy to extract token from `Authorization: Bearer <token>` header
- **User ID Extraction**: Reads user ID from JWT `sub` claim (matches `auth.users.id` in Supabase)
- **User Provisioning**: Business-layer only via `GET /me` endpoint (upserts `public.users` with `id = authUid`)
- **Data Scoping**: All progress operations automatically scoped to authenticated user (never accepts `userId` from client)

### Security Principles

1. **Never Store Tokens**: Backend never stores access/refresh tokens in database
2. **Server-Side Verification**: All JWT verification happens server-side
3. **User ID Matching**: `public.users.id` MUST equal `auth.users.id` (enforced at schema level)
4. **No Client User ID**: Client never supplies `userId` in request payloads
5. **Idempotent Operations**: Progress operations are safe to retry
6. **Immutable Logs**: Performance logs are append-only (never updated)

## Deployment Considerations

### Backend

1. **Environment Variables**: 
   - `DATABASE_URL`: PostgreSQL connection string
   - `SUPABASE_URL`: Supabase project URL (required)
   - `SUPABASE_JWT_SECRET`: JWT secret for token verification (required)
   - `SUPABASE_ANON_KEY`: Supabase anonymous key (optional)
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (optional, fallback for JWT verification)
   - `PORT`: Server port (default: 3000)
   - `NODE_ENV`: Environment (development/production)

2. **Database Migrations**:
   ```bash
   npm run prisma:migrate:deploy  # Production migrations
   ```

3. **Connection Pooling**: Already configured in PrismaService with `@prisma/adapter-pg`

4. **Validation**: Global validation pipes enabled in `main.ts` with class-validator

### Mobile

1. **Environment Variables**:
   - `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

2. **Build Process**:
   - iOS: `expo build:ios` or EAS Build
   - Android: `expo build:android` or EAS Build

3. **App Configuration**: Managed in `app.config.ts` and `app.json`

## Learning Orchestration

### GET /learn/next Algorithm

The `/learn/next` endpoint implements the core learning orchestration logic:

1. **Validate & Ensure UserLesson**: Upserts `UserLesson` if it doesn't exist (implicitly starts lesson)

2. **Prioritize Due Reviews**:
   - Finds all questions in the lesson
   - Identifies questions where `nextReviewDue <= now`
   - Deduplicates by question (keeps latest attempt per question)
   - Returns `type="review"` if due reviews exist

3. **Return New Content**:
   - If no due reviews, finds next unanswered or least-practiced question
   - Returns `type="new"` with question payload

4. **Done State**:
   - If all questions completed, returns `type="done"`

5. **Delivery Method Suggestion**:
   - Uses `UserDeliveryMethodScore` preferences if available
   - Falls back to first available delivery method

**Response Shape:**
```typescript
{
  type: "review" | "new" | "done",
  lessonId: string,
  teachingId?: string,
  question?: { id, teachingId, deliveryMethods },
  suggestedDeliveryMethod?: DELIVERY_METHOD,
  rationale?: string
}
```

### Spaced Repetition

Question attempts use a simple spaced repetition algorithm:
- Score >= 80: Next review due in 2 days
- Score < 80: Next review due in 1 day
- Stored in `UserQuestionPerformance.nextReviewDue`

## Implemented (Current)

### Backend
- RESTful API endpoints for all entities
- Input validation with class-validator
- JWT authentication with Supabase (`SupabaseJwtGuard`, `supabase.strategy`)
- **Error handling**: Global exception filters (`AllExceptionsFilter`, `HttpExceptionFilter`, `PrismaExceptionFilter`) in `main.ts`
- **CORS**: Configured in `main.ts` via `app.enableCors()` and `CORS_ORIGIN` env

### Mobile
- **Backend API integration**: Mobile uses `apiClient` (in `services/api/client.ts`) to call NestJS endpoints for learn, progress, profile, modules, mastery, onboarding, etc.

## Future Enhancements

### Backend
- [ ] Rate limiting
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] Admin role-based access control
- [ ] JWKS verification (currently uses JWT_SECRET)

### Mobile
- [ ] Offline support with local caching
- [ ] Push notifications
- [ ] Analytics integration
- [ ] Performance monitoring
- [ ] Enhanced error boundaries
- [ ] E2E testing with Maestro

## Conclusion

The Fluentia architecture follows modern best practices with clear separation of concerns, type safety, and scalable patterns. The feature-first mobile architecture and modular backend design make the codebase maintainable and extensible.

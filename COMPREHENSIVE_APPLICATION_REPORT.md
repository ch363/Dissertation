# Fluentia - Comprehensive Application Report

**Generated:** January 27, 2026  
**Version:** 1.0  
**Project Type:** Dissertation - Language Learning Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Backend API](#backend-api)
4. [Mobile Application](#mobile-application)
5. [Database Schema](#database-schema)
6. [Core Features & Functionality](#core-features--functionality)
7. [User Interface & Design System](#user-interface--design-system)
8. [Algorithms & Intelligence](#algorithms--intelligence)
9. [Authentication & Security](#authentication--security)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Testing & Quality Assurance](#testing--quality-assurance)
12. [Deployment & Configuration](#deployment--configuration)

---

## Executive Summary

**Fluentia** is a comprehensive language learning platform designed as a dissertation project. It consists of a React Native mobile application and a NestJS backend API, providing an adaptive, personalized language learning experience with multiple learning modalities, progress tracking, and intelligent content delivery.

### Key Highlights

- **Full-Stack Application**: React Native mobile app + NestJS backend API
- **Adaptive Learning**: Personalized content delivery based on user performance and preferences
- **Multiple Learning Modalities**: 6 different delivery methods (flashcards, multiple choice, fill-in-blank, speech-to-text, text-to-speech, translation)
- **Intelligent Algorithms**: FSRS spaced repetition, Bayesian Knowledge Tracing (BKT) for skill mastery
- **Comprehensive Progress Tracking**: Lesson progress, skill mastery, spaced repetition scheduling
- **Onboarding System**: Personalized experience setup with preference-based initialization
- **Speech Recognition**: Azure Cognitive Services integration for pronunciation assessment
- **Modern Tech Stack**: TypeScript, Prisma ORM, PostgreSQL, Supabase Auth, Expo Router

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│              (React Native + Expo Router)                     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Home    │  │  Learn  │  │ Profile  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Session  │  │ Course   │  │Settings  │  │Onboarding│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        │ HTTP/REST + JWT
                        │
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend API                                │
│                   (NestJS 11.x)                               │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │   Progress   │  │   Learn      │    │
│  │   Module     │  │   Module     │  │   Module     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Engine     │  │   Content    │  │   Speech     │    │
│  │   Module     │  │   Module     │  │   Module     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        │ Prisma ORM
                        │
┌──────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database                              │
│                                                               │
│  • Content (Modules, Lessons, Teachings, Questions)        │
│  • User Progress & Performance                                │
│  • Skill Mastery & SRS State                                 │
│  • Onboarding Preferences                                     │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│                                                               │
│  • Supabase Auth (JWT Authentication)                         │
│  • Azure Cognitive Services (Speech/Pronunciation)           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL
- **ORM**: Prisma 7.x
- **Authentication**: Supabase JWT
- **Speech Services**: Azure Cognitive Services Speech SDK
- **API Documentation**: Swagger/OpenAPI

#### Mobile
- **Framework**: React Native 0.74.x
- **Build System**: Expo 51.x
- **Routing**: Expo Router 3.x (file-based routing)
- **State Management**: React Context API
- **Backend Integration**: Supabase Client + REST API
- **Language**: TypeScript 5.x
- **Fonts**: Poppins (400, 600, 700 weights)

---

## Backend API

### Module Structure

The backend follows NestJS modular architecture with clear separation of concerns:

#### Core Modules

1. **Auth Module** (`auth/`)
   - JWT verification via Supabase
   - User ID extraction from JWT tokens
   - Guards for route protection
   - Custom decorators (`@User()` for user ID)

2. **Users Module** (`users/`)
   - User CRUD operations
   - Profile management
   - User preferences

3. **Me Module** (`me/`)
   - User provisioning endpoint (`GET /me`)
   - Dashboard statistics
   - Recent activity tracking
   - Profile management
   - Avatar upload
   - Progress reset functionality

4. **Content Modules**
   - **Modules Module**: Top-level learning units
   - **Lessons Module**: Individual lessons within modules
   - **Teachings Module**: Learning content items (phrases, vocabulary)
   - **Questions Module**: Practice questions with multiple delivery methods

5. **Progress Module** (`progress/`)
   - Lesson engagement tracking
   - Teaching completion markers
   - Question attempt logging (append-only)
   - Spaced repetition scheduling
   - Delivery method performance scores
   - Knowledge level progression (XP)
   - Answer validation
   - Pronunciation assessment

6. **Learn Module** (`learn/`)
   - Learning orchestration
   - Session plan generation
   - Content suggestions
   - Learning path construction
   - Review summaries

7. **Engine Module** (`engine/`)
   - **Content Delivery Service**: Session plan generation
   - **Session Plan Service**: Complete session planning with teach-then-test
   - **Mastery Service**: Bayesian Knowledge Tracing (BKT)
   - **SRS Service**: FSRS spaced repetition algorithm
   - **XP Service**: Experience point calculation
   - **Selection Policy**: Content ranking and prioritization
   - **Session Planning Policy**: Modality selection, interleaving, time estimation

8. **Onboarding Module** (`onboarding/`)
   - Onboarding answer collection
   - Preference extraction and initialization
   - Delivery method score initialization
   - BKT parameter initialization

9. **Speech Module** (`speech/`)
   - **Pronunciation Service**: Azure Cognitive Services integration
   - Audio format detection and conversion
   - Pronunciation scoring and feedback
   - Word-level analysis

10. **Search Module** (`search/`)
    - Content search functionality
    - Full-text search capabilities

11. **Content Module** (`content/`)
    - Content lookup service
    - Options generator for multiple choice
    - Content validation
    - Content importer utilities

12. **Health Module** (`health/`)
    - Health check endpoints
    - System status monitoring

### Key Services

#### SessionPlanService
Generates complete learning session plans with:
- **Modes**: `learn`, `review`, `mixed`
- **Time-based pacing**: Adaptive item count based on time budget
- **Teach-then-test**: New content shown as teaching before practice
- **Interleaving**: Mix of delivery methods and content types
- **Adaptive modality selection**: Based on user performance scores
- **Prioritization**: Due reviews, low mastery skills, challenge preferences
- **Topic grouping**: Related content grouped together

#### ProgressService
Comprehensive progress tracking:
- **Lesson engagement**: Start/update lesson progress
- **Teaching completion**: Immutable markers for completed teachings
- **Question attempts**: Append-only log with SRS state
- **Answer validation**: Multi-method validation (multiple choice, fill-blank, speech, translation)
- **Pronunciation assessment**: Integration with Azure Speech Services
- **Delivery method scoring**: Adaptive performance tracking
- **XP calculation**: Knowledge level progression
- **Due reviews**: Spaced repetition scheduling

#### MasteryService
Bayesian Knowledge Tracing implementation:
- **Skill mastery probability**: Tracks probability user knows each skill
- **BKT parameters**: Prior, Learn, Guess, Slip probabilities
- **Onboarding-based initialization**: Personalized BKT parameters
- **Low mastery detection**: Identifies skills needing attention
- **Skill tag extraction**: From teachings and questions

#### SrsService
FSRS (Free Spaced Repetition Scheduler) implementation:
- **State calculation**: Stability, difficulty, repetitions
- **Parameter optimization**: User-specific FSRS parameters
- **Review scheduling**: Next review due dates
- **Interval calculation**: Adaptive intervals based on performance

#### ContentDeliveryService
Orchestrates content delivery:
- **Session plan generation**: Complete learning sessions
- **Cache management**: Session plan caching for performance
- **Content lookup**: Efficient content retrieval
- **Candidate gathering**: Review and new content candidates

---

## Mobile Application

### Architecture Pattern

The mobile app uses a **feature-first (vertical slice) architecture**:

```
mobile/src/
├── app/                    # Expo Router routes (file-based)
│   ├── (auth)/            # Authentication routes
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main tab navigation
│   │   ├── home/          # Home tab
│   │   ├── learn/         # Learn tab
│   │   ├── profile/       # Profile tab
│   │   └── settings/      # Settings tab
│   ├── course/            # Course/module routes
│   ├── session/           # Learning session routes
│   └── practice/          # Practice tool routes
├── features/               # Feature modules (vertical slices)
│   ├── auth/              # Authentication feature
│   ├── onboarding/        # Onboarding feature
│   ├── home/               # Home screen feature
│   ├── learn/              # Learning feature
│   ├── course/             # Course browsing feature
│   ├── session/            # Session runner feature
│   ├── profile/            # Profile feature
│   └── settings/           # Settings feature
├── services/               # Cross-cutting services
│   ├── api/                # API client layer
│   ├── auth/               # Auth provider
│   ├── theme/              # Theme provider
│   ├── navigation/        # Navigation utilities
│   ├── preferences/        # User preferences
│   └── tts/                # Text-to-speech
├── components/             # Shared UI components
│   ├── ui/                 # UI primitives
│   ├── learn/              # Learning-specific components
│   ├── profile/            # Profile components
│   └── navigation/        # Navigation components
└── types/                  # TypeScript type definitions
```

### Main Screens

#### 1. Landing Screen (`index.tsx`)
- Entry point for unauthenticated users
- Sign in / Sign up navigation
- Route guard redirects authenticated users

#### 2. Authentication Screens (`(auth)/`)
- **Sign In** (`sign-in.tsx`): Email/password authentication
- **Sign Up** (`sign-up.tsx`): User registration
- **Forgot Password** (`forgot-password.tsx`): Password reset flow
- **Update Password** (`update-password.tsx`): Password update
- **Verify Email** (`verify-email.tsx`): Email verification

#### 3. Onboarding Flow (`(onboarding)/`)
Multi-step onboarding process:
1. **Welcome** (`welcome.tsx`): Introduction
2. **Motivation & Goals** (`1_motivation-goals.tsx`): Learning goals
3. **Preferred Learning** (`2_preferred-learning.tsx`): Learning style preferences
4. **Memory Habits** (`3_memory-habits.tsx`): Memory and study habits
5. **Difficulty** (`4_difficulty.tsx`): Challenge preference (easy/balanced/hard)
6. **Gamification** (`5_gamification.tsx`): Gamification preferences
7. **Feedback Style** (`6_feedback-style.tsx`): Feedback depth (gentle/direct/detailed)
8. **Session Style** (`7_session-style.tsx`): Session length preference
9. **Tone** (`8_tone.tsx`): App tone preference
10. **Experience Level** (`9_experience-level.tsx`): Prior language learning experience
11. **Completion** (`completion.tsx`): Onboarding summary

#### 4. Home Screen (`(tabs)/home/index.tsx`)
Main dashboard featuring:
- **Welcome Header**: Personalized greeting with user name
- **Primary CTA Card**: 
  - Start Review (if due reviews exist)
  - Continue Lesson (if active lesson)
  - Start Next Lesson (suggested content)
- **Today at a Glance**: 
  - Streak days
  - Minutes studied today
  - Due review count
- **Why This Next**: Explanation of next recommended action
- **Continue Learning Card**: Quick access to active lessons
- **Discover Carousel**: Suggested lessons and modules

#### 5. Learn Screen (`(tabs)/learn/index.tsx`)
Learning hub with:
- **Learn Header**: Navigation and context
- **Review Section**: Due reviews summary with quick start
- **Learning Path Carousel**: Progress through modules and lessons
- **Discover Carousel**: Suggested new content
- **Lesson List** (`list.tsx`): Browse all available lessons
- **Lesson Overview** (`[lessonId]/index.tsx`): Lesson details and start option
- **Lesson Start** (`[lessonId]/start.tsx`): Pre-session configuration

#### 6. Session Runner (`session/[sessionId]/index.tsx`)
Core learning experience:
- **Session Runner Component**: Orchestrates session flow
- **Card Renderer**: Renders appropriate card type based on delivery method
- **Card Types**:
  - **TeachCard**: Teaching/learning cards with phrase, translation, TTS
  - **MultipleChoiceCard**: Multiple choice questions
  - **FillBlankCard**: Fill-in-the-blank questions
  - **TranslateCard**: Translation questions (both directions)
  - **ListeningCard**: Audio/listening questions with speech recognition
- **Progress Tracking**: Real-time progress updates
- **Lesson Progress Header**: Shows completion status
- **Session Summary** (`summary.tsx`): Post-session statistics
- **Completion Screen** (`completion.tsx`): Session completion celebration

#### 7. Profile Screen (`(tabs)/profile/index.tsx`)
User profile and statistics:
- **Profile Header**: Avatar, name, edit functionality
- **Progress Summary**: Overall learning progress
- **Dashboard Stats**: Streak, XP, active lessons, due reviews
- **Recent Activity**: Latest learning activity
- **Skill Mastery**: Skill mastery levels with BKT probabilities
- **Sub-screens**:
  - **Progress** (`progress.tsx`): Detailed progress metrics
  - **Skills** (`skills.tsx`): Skill mastery breakdown
  - **Reviews** (`reviews.tsx`): Due reviews management
  - **Edit** (`edit.tsx`): Profile editing

#### 8. Settings Screen (`(tabs)/settings/index.tsx`)
Application settings:
- **Appearance**: Dark mode toggle
- **Learning**:
  - Speech settings (TTS, speed)
  - Session defaults (time budget, mode, lesson selection)
- **Accessibility**: Reduce motion preference
- **Notifications**: Notification preferences
- **Account**: Sign out, delete account
- **Sub-screens**:
  - **Speech** (`speech.tsx`): TTS configuration
  - **Session Defaults** (`session.tsx`): Default session preferences
  - **Session Lesson Picker** (`session-lesson.tsx`): Default lesson selection

#### 9. Course Screens (`course/`)
- **Course Index** (`index.tsx`): Browse all modules/courses
- **Course Detail** (`[slug]/index.tsx`): Module details with lessons
- **Course Run** (`[slug]/run.tsx`): Start learning a module

#### 10. Practice Tools (`practice/`)
Standalone practice tools:
- **Flashcards** (`flashcards.tsx`): Flashcard practice
- **Typing** (`typing.tsx`): Typing practice
- **Listening** (`listening.tsx`): Listening comprehension

### Key Components

#### UI Components (`components/ui/`)
- **Button**: Primary, secondary, ghost variants
- **IconButton**: Icon-only buttons with accessibility
- **ListRow**: List item with title, subtitle, right element
- **ListDivider**: Section dividers
- **ScrollView**: Themed scroll view
- **SurfaceCard**: Card container with theme support

#### Learning Components (`components/learn/`)
- **LearnHeader**: Screen header with navigation
- **ReviewSection**: Due reviews summary and quick start
- **LearningPathCarousel**: Horizontal carousel of learning path items
- **DiscoverCarousel**: Suggested content carousel
- **LessonMicroProgress**: Mini progress indicator
- **PracticeToolsGrid**: Grid of practice tool cards
- **ContinueLearningCard**: Active lesson quick access

#### Profile Components (`components/profile/`)
- **Header**: Profile header with avatar and name
- **Card**: Profile card container
- **ProgressBar**: Progress visualization
- **StatCard**: Statistics display card
- **ActivityCard**: Recent activity card
- **MasteryCard**: Skill mastery display
- **Badge**: Achievement badges

#### Navigation Components (`components/navigation/`)
- **TabBarButton**: Custom tab bar button
- **TabIcons**: Tab icon definitions
- **BreadcrumbTitle**: Breadcrumb navigation title

### Services Layer

#### API Services (`services/api/`)
- **auth.ts**: Authentication API calls
- **client.ts**: HTTP client configuration
- **config.ts**: API configuration
- **learn.ts**: Learning API (session plans, suggestions)
- **modules.ts**: Content API (modules, lessons, teachings)
- **profile.ts**: Profile API (dashboard, stats, mastery)
- **progress.ts**: Progress API (lessons, attempts, reviews)
- **onboarding.ts**: Onboarding API
- **mastery.ts**: Mastery API
- **types.ts**: API type definitions
- **Caching Services**:
  - `learn-screen-cache.ts`: Learn screen data caching
  - `profile-screen-cache.ts`: Profile screen data caching
  - `session-plan-cache.ts`: Session plan caching

#### Theme Service (`services/theme/`)
- **ThemeProvider**: Theme context provider
- **tokens.ts**: Design tokens (colors, spacing, typography)
- **Light/Dark themes**: Full theme support
- **WCAG AA compliance**: Contrast ratios verified

#### Preferences Service (`services/preferences/`)
- **TTS preferences**: Text-to-speech settings
- **Session defaults**: Default session configuration
- **Theme preferences**: Light/dark mode
- **Accessibility preferences**: Reduce motion, etc.

#### Auth Service (`services/auth/`)
- **AuthProvider**: Authentication context
- **Session management**: User session state
- **Route protection**: Authentication-based routing

#### Navigation Service (`services/navigation/`)
- **RouteGuard**: Protected route handling
- **routes.ts**: Centralized route definitions
- **Navigation utilities**: Type-safe navigation

---

## Database Schema

### Entity Relationship Diagram

```
Module (1) ──< (many) Lesson
Lesson (1) ──< (many) Teaching
Teaching (1) ──< (many) Question
Question (1) ──< (many) QuestionVariant (delivery methods)
Teaching (many) ──< (many) SkillTag
Question (many) ──< (many) SkillTag

User (1) ──< (many) UserLesson
User (1) ──< (many) UserTeachingCompleted
User (1) ──< (many) UserQuestionPerformance
User (1) ──< (many) UserDeliveryMethodScore
User (1) ──< (many) UserKnowledgeLevelProgress
User (1) ──< (many) UserSkillMastery
User (1) ──< (many) XpEvent
User (1) ──< (1) OnboardingAnswer
```

### Core Models

#### Content Models

**Module**
- `id` (UUID, primary key)
- `title` (string)
- `description` (string, optional)
- `imageUrl` (string, optional)
- `createdAt`, `updatedAt` (timestamps)
- Relations: `lessons[]`

**Lesson**
- `id` (UUID, primary key)
- `title` (string)
- `description` (string, optional)
- `imageUrl` (string, optional)
- `numberOfItems` (integer, default: 0)
- `moduleId` (UUID, foreign key → Module)
- `createdAt`, `updatedAt` (timestamps)
- Relations: `module`, `teachings[]`, `userLessons[]`

**Teaching**
- `id` (UUID, primary key)
- `knowledgeLevel` (enum: A1, A2, B1, B2, C1, C2)
- `emoji` (string, optional)
- `userLanguageString` (string) - Translation in user's language
- `learningLanguageString` (string) - Phrase in learning language
- `tip` (string, optional) - Learning tip
- `lessonId` (UUID, foreign key → Lesson)
- `createdAt`, `updatedAt` (timestamps)
- Relations: `lesson`, `questions[]`, `userTeachingsCompleted[]`, `skillTags[]`

**Question**
- `id` (UUID, primary key)
- `teachingId` (UUID, foreign key → Teaching)
- Relations: `teaching`, `variants[]`, `userQuestionPerformance[]`, `skillTags[]`

**QuestionVariant**
- `id` (UUID, primary key)
- `questionId` (UUID, foreign key → Question)
- `deliveryMethod` (enum: FILL_BLANK, FLASHCARD, MULTIPLE_CHOICE, SPEECH_TO_TEXT, TEXT_TO_SPEECH, TEXT_TRANSLATION)
- `data` (JSON, optional) - Delivery method-specific data
- `createdAt`, `updatedAt` (timestamps)
- Relations: `question`
- Unique constraint: `[questionId, deliveryMethod]`

**SkillTag**
- `id` (UUID, primary key)
- `name` (string, unique) - Skill identifier
- `description` (string, optional)
- `createdAt`, `updatedAt` (timestamps)
- Relations: `teachings[]`, `questions[]`

#### User & Progress Models

**User**
- `id` (UUID, primary key) - Matches Supabase auth.users.id
- `name` (string, optional)
- `avatarUrl` (string, optional)
- `knowledgePoints` (integer, default: 0) - XP total
- `knowledgeLevel` (enum: A1-C2, default: A1)
- `preferredDeliveryMethod` (enum, optional)
- `createdAt`, `updatedAt` (timestamps)
- Relations: All user progress tables

**UserLesson**
- Composite primary key: `[userId, lessonId]`
- `completedTeachings` (integer, default: 0)
- `createdAt`, `updatedAt` (timestamps)
- Relations: `user`, `lesson`

**UserTeachingCompleted**
- Composite primary key: `[userId, teachingId]`
- `createdAt` (timestamp)
- Relations: `user`, `teaching`
- **Immutable**: Append-only, never updated

**UserQuestionPerformance**
- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `questionId` (UUID, foreign key → Question)
- `deliveryMethod` (enum)
- `score` (integer, 0-100)
- `timeToComplete` (integer, optional, milliseconds)
- `percentageAccuracy` (integer, optional, 0-100)
- `attempts` (integer, optional)
- `createdAt` (timestamp)
- `lastRevisedAt` (timestamp, optional)
- `nextReviewDue` (timestamp, optional) - SRS scheduling
- `intervalDays` (integer, optional) - SRS interval
- `stability` (float, optional) - FSRS stability
- `difficulty` (float, optional) - FSRS difficulty
- `repetitions` (integer, optional, default: 0) - FSRS repetitions
- Relations: `user`, `question`
- **Append-only**: Never updated, always inserted
- Indexes: `[userId]`, `[questionId]`, `[userId, questionId]`, `[deliveryMethod]`, `[nextReviewDue]`

**UserDeliveryMethodScore**
- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `deliveryMethod` (enum)
- `score` (float, 0-1) - Performance score
- `updatedAt` (timestamp)
- Relations: `user`
- Unique constraint: `[userId, deliveryMethod]`
- Indexes: `[userId]`, `[deliveryMethod]`

**UserKnowledgeLevelProgress**
- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `value` (integer) - XP value at time of record
- `createdAt` (timestamp)
- Relations: `user`
- Indexes: `[userId]`, `[createdAt]`

**UserSkillMastery**
- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `skillTag` (string) - Skill identifier
- `masteryProbability` (float, 0-1) - BKT mastery probability
- `prior` (float, default: 0.3) - BKT prior parameter
- `learn` (float, default: 0.2) - BKT learn parameter
- `guess` (float, default: 0.2) - BKT guess parameter
- `slip` (float, default: 0.1) - BKT slip parameter
- `lastUpdated`, `createdAt` (timestamps)
- Relations: `user`
- Unique constraint: `[userId, skillTag]`
- Indexes: `[userId]`, `[skillTag]`, `[userId, masteryProbability]`

**XpEvent**
- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `amount` (integer) - XP amount
- `reason` (string) - Event reason
- `occurredAt` (timestamp)
- Relations: `user`
- Indexes: `[userId]`, `[userId, occurredAt]`

**OnboardingAnswer**
- `userId` (UUID, primary key, foreign key → User)
- `answers` (JSON) - Complete onboarding submission
- `createdAt`, `updatedAt` (timestamps)
- Relations: `user`

### Database Features

- **UUID Primary Keys**: All entities use UUIDs for better distribution
- **Timestamps**: Automatic `created_at` and `updated_at` tracking
- **Indexes**: Strategic indexes on foreign keys and frequently queried fields
- **Enums**: Type-safe enums for knowledge levels and delivery methods
- **Relations**: Proper foreign key relationships with cascade deletes
- **Immutable Logs**: `UserQuestionPerformance` and `UserTeachingCompleted` are append-only
- **Composite Keys**: Used for many-to-many relationships (UserLesson, UserTeachingCompleted)

---

## Core Features & Functionality

### 1. Authentication & User Management

#### Authentication Flow
1. User signs in/up via Supabase Auth
2. Supabase returns JWT token
3. Mobile app stores token
4. All API requests include `Authorization: Bearer <token>` header
5. Backend verifies JWT using Supabase JWT secret
6. User ID extracted from JWT `sub` claim
7. User automatically provisioned on first `GET /me` request

#### User Provisioning
- **Automatic**: Happens on first authenticated request to `GET /me`
- **Idempotent**: Safe to call multiple times
- **User ID Matching**: `public.users.id` MUST equal `auth.users.id` (enforced at schema level)
- **Profile Creation**: User record created with default values

#### Profile Management
- **Avatar Upload**: Base64 image upload, URL storage
- **Name Update**: User name can be updated
- **Preferences**: Delivery method preferences, knowledge level
- **Account Deletion**: Complete account and data deletion

### 2. Onboarding System

#### Onboarding Flow
Multi-step questionnaire collecting:
1. **Motivation & Goals**: Why learning, specific goals
2. **Preferred Learning**: Learning style preferences (visual, auditory, kinesthetic, reading/writing)
3. **Memory Habits**: Study habits and memory techniques
4. **Difficulty**: Challenge preference (easy: 0.25, balanced: 0.5, hard: 0.85)
5. **Gamification**: Gamification preference (none: 0, light: 0.45, full: 0.9)
6. **Feedback Style**: Feedback depth (gentle: 0.3, direct: 0.6, detailed: 0.9)
7. **Session Style**: Preferred session length (short: 8min, focused: 22min, deep: 45min)
8. **Tone**: App tone preference
9. **Experience Level**: Prior language learning experience

#### Preference Initialization
Onboarding answers are processed to initialize:
- **Delivery Method Scores**: Initial performance scores based on learning style
- **BKT Parameters**: Personalized Bayesian Knowledge Tracing parameters
- **Challenge Weight**: Difficulty preference (0.25-0.85)
- **Session Minutes**: Default session length
- **Feedback Depth**: Feedback detail level (0.3-0.9)
- **Gamification Level**: XP and achievement preferences

### 3. Content Delivery System

#### Content Hierarchy
```
Module
  └── Lesson
      └── Teaching (learning content)
          └── Question (practice)
              └── QuestionVariant (delivery method specific)
```

#### Delivery Methods
1. **FILL_BLANK**: Fill-in-the-blank questions
2. **FLASHCARD**: Flashcard practice
3. **MULTIPLE_CHOICE**: Multiple choice questions
4. **SPEECH_TO_TEXT**: Speech recognition practice
5. **TEXT_TO_SPEECH**: Pronunciation practice
6. **TEXT_TRANSLATION**: Translation practice (both directions)

#### Session Planning
The system generates complete learning sessions with:

**Modes**:
- `learn`: New content only (with teach-then-test)
- `review`: Due reviews only
- `mixed`: 70% reviews, 30% new content

**Features**:
- **Time-based pacing**: Adaptive item count based on time budget
- **Teach-then-test**: New content shown as teaching before practice
- **Interleaving**: Mix of delivery methods and content types
- **Topic grouping**: Related content grouped together
- **Adaptive modality**: Delivery method selection based on performance
- **Prioritization**: Due reviews, low mastery skills, challenge preferences
- **Difficulty adjustment**: Based on onboarding challenge weight

**Session Structure**:
1. **Teaching Steps**: New content introductions
2. **Practice Steps**: Question practice
3. **Recap Steps**: Review of covered content
4. **Interleaved**: Mix of types for better retention

### 4. Progress Tracking

#### Lesson Progress
- **Engagement Tracking**: When user starts a lesson
- **Completion Tracking**: Number of completed teachings
- **Progress Calculation**: Based on completed teachings vs. total teachings
- **Due Review Count**: Questions due for review in each lesson

#### Teaching Completion
- **Immutable Markers**: Append-only records in `UserTeachingCompleted`
- **Completion Tracking**: Tracks which teachings user has seen
- **Filtering**: Used to prevent re-showing completed content

#### Question Performance
- **Append-only Log**: Every attempt creates new `UserQuestionPerformance` record
- **Performance Metrics**:
  - Score (0-100)
  - Time to complete
  - Percentage accuracy
  - Attempt count
- **SRS State**: Spaced repetition scheduling data
- **Delivery Method**: Tracks which delivery method was used

#### Spaced Repetition (FSRS)
- **FSRS Algorithm**: Free Spaced Repetition Scheduler
- **State Tracking**: Stability, difficulty, repetitions
- **Parameter Optimization**: User-specific FSRS parameters
- **Review Scheduling**: `nextReviewDue` calculated based on performance
- **Interval Calculation**: Adaptive intervals (minimum 5 minutes)

#### Skill Mastery (BKT)
- **Bayesian Knowledge Tracing**: Tracks probability user knows each skill
- **BKT Parameters**: Prior, Learn, Guess, Slip probabilities
- **Onboarding-based Initialization**: Personalized parameters
- **Skill Tag Extraction**: From teachings and questions
- **Low Mastery Detection**: Identifies skills needing attention (< 0.5 probability)

#### Delivery Method Scoring
- **Performance Tracking**: Scores for each delivery method (0-1)
- **Adaptive Selection**: System favors methods user performs best on
- **Weighted Random**: 85% weighted selection, 15% exploration
- **Onboarding Initialization**: Initial scores based on learning style

#### Knowledge Level Progression
- **XP System**: Experience points for completed activities
- **Level Tracking**: A1-C2 knowledge level progression
- **Progress History**: Historical XP progression in `UserKnowledgeLevelProgress`
- **XP Events**: Detailed XP event logging

### 5. Answer Validation

#### Multiple Choice
- Validates selected option against correct answer
- Returns score (100 if correct, 0 if incorrect)
- Feedback based on feedback depth preference

#### Fill in the Blank
- Normalizes user input (lowercase, trim)
- Compares against learning language string
- Handles multiple correct answers
- Feedback with hints if incorrect

#### Speech Recognition
- **Azure Cognitive Services**: Speech-to-text recognition
- **Pronunciation Assessment**: Word-level and phoneme-level analysis
- **Scoring**: Overall score, accuracy, completeness, fluency
- **Error Detection**: Omission, insertion, mispronunciation, breaks
- **Audio Format Support**: WAV, PCM, various containers

#### Translation
- Validates translation in both directions
- Compares against reference translations
- Handles multiple correct answers
- Feedback with teaching context

### 6. Feedback System

#### Feedback Depth Levels
Based on onboarding preference:

**Gentle (0.3)**:
- Minimal feedback
- Just correct/incorrect indication

**Direct (0.6)**:
- Moderate feedback
- Brief explanations
- Hints when incorrect

**Detailed (0.9)**:
- Comprehensive feedback
- Tips and examples
- Translation reminders
- Encouragement for correct answers

### 7. Learning Orchestration

#### Next Item Algorithm
1. **Prioritize Due Reviews**: Finds questions where `nextReviewDue <= now`
2. **Deduplication**: Keeps latest attempt per question
3. **New Content**: If no due reviews, finds next unanswered question
4. **Done State**: Returns `type="done"` if all questions completed
5. **Delivery Method Suggestion**: Uses performance scores or defaults

#### Content Suggestions
- **Lesson Suggestions**: Based on user progress and mastery
- **Module Suggestions**: Based on completion and interests
- **Reasoning**: Explains why content is suggested
- **Filtering**: Excludes already-completed content

#### Learning Path
- **Path Construction**: Builds learning path from modules and lessons
- **Progress Integration**: Shows user progress along path
- **Visualization**: Carousel display of path items
- **Navigation**: Direct links to lessons and modules

### 8. Caching System

#### Screen-Level Caching
- **Learn Screen Cache**: Caches modules, lessons, progress, suggestions
- **Profile Screen Cache**: Caches profile, dashboard, mastery, activity
- **Background Refresh**: Updates cache in background after initial load
- **Instant Load**: Uses cache for instant screen loads

#### Session Plan Caching
- **Session Plan Cache**: Caches generated session plans
- **Cache Invalidation**: Invalidated on progress updates
- **Performance**: Reduces computation for repeated requests

#### Avatar Caching
- **Avatar Cache**: Caches user avatars locally
- **URL Refresh**: Refreshes signed URLs from Supabase
- **Fallback**: Falls back to cached version on error

---

## User Interface & Design System

### Design Tokens

#### Colors
**Light Theme**:
- Primary: `#1A6FD6` (blue)
- Secondary: `#12BFA1` (teal)
- Background: `#F4F8FF` (light blue)
- Card: `#FFFFFF` (white)
- Text: `#0D1B2A` (dark blue)
- Muted Text: `#5B6C84` (gray)
- Success: `#2E7D32` (green)
- Error: `#D32F2F` (red)
- Border: `#E5EAF2` (light gray)

**Dark Theme**:
- Primary: `#62A0FF` (light blue)
- Secondary: `#26D4BA` (light teal)
- Background: `#0E141B` (dark blue)
- Card: `#172435` (dark card)
- Text: `#E6EEF8` (light text)
- Muted Text: `#9FB1C6` (muted)
- Success: `#30D158` (green)
- Error: `#FF453A` (red)
- Border: `#2A3A4F` (dark border)

#### Typography
- **Font Family**: Poppins
- **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Sizes**: Responsive based on context

#### Spacing
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

#### Radius
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `round`: 999px (fully rounded)

### UI Components

#### Button
- **Variants**: Primary, Secondary, Ghost
- **States**: Default, Disabled, Loading
- **Accessibility**: Full ARIA labels and hints
- **Minimum Touch Target**: 44x44px

#### IconButton
- Icon-only buttons
- Customizable hit slop
- Accessibility labels
- Busy state support

#### ListRow
- **Variants**: Default, Navigation, Destructive
- **Elements**: Title, subtitle, right element (icon/switch)
- **Pressable**: Optional onPress handler
- **Accessibility**: Full support

#### SurfaceCard
- Card container with theme support
- Shadow/elevation
- Border radius
- Background color from theme

#### ScrollView
- Themed scroll view
- Disabled bounce (iOS) and overscroll (Android)
- Content container styling

### Navigation

#### Tab Navigation
- **Tabs**: Home, Learn, Progress (Profile), Settings
- **Custom Tab Bar**: Themed tab bar with icons
- **Active State**: Visual indication of active tab
- **Accessibility**: Tab labels and hints

#### Stack Navigation
- **File-based Routing**: Expo Router
- **Route Guards**: Authentication-based protection
- **Deep Linking**: Support for deep links
- **Navigation Types**: Stack, Tabs, Modals

### Accessibility

#### WCAG Compliance
- **Contrast Ratios**: All colors meet WCAG AA standards
- **Touch Targets**: Minimum 44x44px
- **Screen Reader Support**: Full ARIA labels and hints
- **Reduce Motion**: Respects user's motion preferences

#### Accessibility Features
- **Semantic HTML**: Proper role attributes
- **Labels**: Descriptive labels for all interactive elements
- **Hints**: Additional context for screen readers
- **States**: Disabled, busy, selected states announced
- **Focus Management**: Proper focus handling

### Responsive Design

#### Screen Sizes
- **Small**: iPhone SE, small Android devices
- **Medium**: Standard phones
- **Large**: Plus-sized phones, tablets

#### Adaptive Layouts
- **Flexible Grids**: Adapts to screen width
- **Scrollable Content**: Handles overflow gracefully
- **Safe Areas**: Respects device safe areas (notches, etc.)

---

## Algorithms & Intelligence

### 1. FSRS (Free Spaced Repetition Scheduler)

#### Algorithm Overview
FSRS is a modern spaced repetition algorithm that calculates optimal review intervals based on:
- **Stability**: Memory strength for the item
- **Difficulty**: Intrinsic difficulty of the item
- **Repetitions**: Number of successful reviews
- **Last Review**: Time since last review

#### Implementation
- **State Calculation**: Updates stability and difficulty after each review
- **Grade Conversion**: Converts attempt results (score, time, accuracy) to FSRS grades (0-5)
- **Parameter Optimization**: User-specific FSRS parameters based on historical performance
- **Interval Calculation**: Calculates next review due date and interval

#### Grade Mapping
- **Grade 5**: Perfect (score >= 95, fast, accurate)
- **Grade 4**: Good (score >= 85)
- **Grade 3**: Pass (score >= 75)
- **Grade 2**: Fail (score >= 60)
- **Grade 1**: Hard (score >= 40)
- **Grade 0**: Again (score < 40)

### 2. Bayesian Knowledge Tracing (BKT)

#### Algorithm Overview
BKT tracks the probability that a user knows a skill based on:
- **Prior (P(L0))**: Initial probability of knowing the skill
- **Learn (P(T))**: Probability of learning after practice
- **Guess (P(G))**: Probability of guessing correctly when not known
- **Slip (P(S))**: Probability of making mistake when known

#### Update Formula
**If correct**:
```
P(L|correct) = (P(L) * (1 - P(S))) / (P(L) * (1 - P(S)) + (1 - P(L)) * P(G))
P(L|next) = P(L|correct) + (1 - P(L|correct)) * P(T)
```

**If incorrect**:
```
P(L|incorrect) = (P(L) * P(S)) / (P(L) * P(S) + (1 - P(L)) * (1 - P(G)))
P(L|next) = P(L|incorrect)
```

#### Implementation
- **Skill Tag Extraction**: Extracts skills from teachings and questions
- **Mastery Tracking**: Tracks mastery probability for each skill
- **Parameter Initialization**: Personalized BKT parameters from onboarding
- **Low Mastery Detection**: Identifies skills with mastery < 0.5

### 3. Content Selection & Ranking

#### Candidate Ranking
Candidates are ranked based on:
1. **Due Score**: Due reviews get highest priority (1000+ points)
2. **Error Count**: More errors = higher priority (+50 per error)
3. **Time Since Last Seen**: Longer = higher priority for reviews
4. **Prioritized Skills**: Low mastery skills get bonus (+500) for new items
5. **Challenge Weight**: Adjusts difficulty preference
   - Easy (0.25): Boosts easier items (difficulty < 0.4)
   - Hard (0.85): Boosts harder items (difficulty > 0.6)
   - Balanced (0.4-0.7): No adjustment

#### Modality Selection
Delivery method selection uses:
- **Performance Scores**: User's performance on each method (0-1)
- **Weighted Random**: 85% weighted selection, 15% exploration
- **Exponential Scaling**: Score^4 to strongly favor best methods
- **Best Method**: Method with highest score selected most often

### 4. Session Planning Algorithm

#### Planning Steps
1. **Get Preferences**: Onboarding preferences (challenge weight, session minutes)
2. **Calculate Target**: Item count from time budget and user averages
3. **Gather Candidates**: Review candidates and new candidates
4. **Filter by Mode**: Select candidates based on mode (learn/review/mixed)
5. **Rank Candidates**: Apply ranking algorithm
6. **Apply Teach-Then-Test**: Pair teachings with new questions
7. **Interleave**: Mix delivery methods and content types
8. **Group by Topic**: Group related content together
9. **Estimate Time**: Calculate estimated session duration

#### Time Estimation
- **User Averages**: Tracks average time per teaching and practice
- **Adaptive Estimation**: Uses user-specific averages
- **Item Count Calculation**: `timeBudgetSec / avgTimePerItem`
- **Default Averages**: Falls back to defaults if no user data

### 5. XP Calculation

#### XP Sources
- **Teaching Completion**: XP for completing teachings
- **Question Attempts**: XP based on score and performance
- **Lesson Completion**: Bonus XP for completing lessons
- **Streak Bonuses**: Additional XP for daily streaks

#### Calculation
- **Base XP**: Fixed amount per activity
- **Performance Multiplier**: Higher scores = more XP
- **Difficulty Multiplier**: Harder content = more XP
- **Streak Multiplier**: Consecutive days = bonus XP

---

## Authentication & Security

### Authentication Flow

1. **User Registration/Sign In**
   - User provides email/password via mobile app
   - Supabase Auth validates credentials
   - Supabase returns JWT token with user ID in `sub` claim

2. **Token Storage**
   - JWT stored in mobile app state (not persisted)
   - Token included in `Authorization: Bearer <token>` header for all API requests

3. **Backend Verification**
   - `SupabaseJwtGuard` verifies JWT on every authenticated endpoint
   - Uses Supabase JWT secret for verification
   - Extracts user ID from `sub` claim
   - Never accepts user ID from client request body

4. **User Provisioning**
   - User automatically created on first `GET /me` request
   - `public.users.id` must match `auth.users.id`
   - Idempotent operation (safe to call multiple times)

### Security Features

#### Input Validation
- **Class Validator**: All DTOs validated with class-validator
- **Whitelist**: Only allowed properties accepted
- **Forbid Non-Whitelisted**: Extra properties rejected
- **Type Transformation**: Automatic type conversion
- **Sanitization**: Input sanitization utilities

#### Rate Limiting
- **Global Rate Limiting**: Applied to all routes via `EnhancedThrottlerGuard`
- **IP-based**: Public endpoints rate limited by IP
- **User-based**: Authenticated endpoints rate limited by user ID
- **Configurable**: Environment variables for limits
- **Headers**: Rate limit headers included in responses

#### Security Headers
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Content-Security-Policy**: Basic CSP
- **Cache-Control**: No-cache for sensitive endpoints

#### Data Scoping
- **User Scoping**: All progress operations automatically scoped to authenticated user
- **No Client User ID**: User ID never accepted from client
- **JWT Extraction**: User ID always from JWT token
- **Immutable Logs**: Performance logs are append-only

#### Error Handling
- **Exception Filters**: Centralized error handling
- **Prisma Exceptions**: Database error handling
- **HTTP Exceptions**: Proper HTTP status codes
- **Error Messages**: Limited error details in production

### CORS Configuration
- **Allowed Origins**: Configurable via environment variables
- **Credentials**: Credentials allowed
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- **Preflight Cache**: 1 hour

---

## API Endpoints Reference

### Authentication
All authenticated endpoints require `Authorization: Bearer <token>` header.

### Identity & User Management (`/me`)

#### `GET /me`
- **Description**: User provisioning endpoint (upserts user from JWT)
- **Auth**: Required
- **Response**: User object

#### `PATCH /me`
- **Description**: Update user preferences
- **Auth**: Required
- **Body**: `UpdateUserDto`
- **Response**: Updated user object

#### `GET /me/dashboard`
- **Description**: Get dashboard statistics
- **Auth**: Required
- **Query**: `tzOffsetMinutes` (optional, number)
- **Response**: Dashboard data (streak, dueReviewCount, activeLessonCount, xpTotal)

#### `GET /me/stats`
- **Description**: Get user statistics (minutes studied today)
- **Auth**: Required
- **Response**: Stats object

#### `GET /me/lessons`
- **Description**: Get user's started lessons with progress
- **Auth**: Required
- **Response**: Array of user lessons with progress

#### `GET /me/recent`
- **Description**: Get recent activity
- **Auth**: Required
- **Response**: Recent activity object

#### `GET /me/mastery`
- **Description**: Get all skill mastery levels
- **Auth**: Required
- **Response**: Array of skill mastery objects

#### `POST /me/reset`
- **Description**: Reset all user progress (or scoped)
- **Auth**: Required
- **Body**: `ResetProgressDto`
- **Response**: Reset confirmation

#### `DELETE /me`
- **Description**: Delete user account and all associated data
- **Auth**: Required
- **Response**: Deletion confirmation

#### `POST /me/avatar`
- **Description**: Upload avatar image
- **Auth**: Required
- **Body**: `UploadAvatarDto` (base64 image)
- **Response**: Updated user object

### Content Management

#### Modules (`/modules`)

- `GET /modules` - List all modules
- `POST /modules` - Create module (admin)
- `GET /modules/:id` - Get module details
- `PATCH /modules/:id` - Update module (admin)
- `DELETE /modules/:id` - Delete module (admin)
- `GET /modules/:id/lessons` - Get lessons for module

#### Lessons (`/lessons`)

- `GET /lessons?moduleId=` - List lessons (filtered by module)
- `POST /lessons` - Create lesson (admin)
- `GET /lessons/:id` - Get lesson details
- `PATCH /lessons/:id` - Update lesson (admin)
- `DELETE /lessons/:id` - Delete lesson (admin)
- `GET /lessons/:id/teachings` - Get teachings for lesson

#### Teachings (`/teachings`)

- `GET /teachings?lessonId=` - List teachings (filtered by lesson)
- `POST /teachings` - Create teaching (admin)
- `GET /teachings/:id` - Get teaching details
- `PATCH /teachings/:id` - Update teaching (admin)
- `DELETE /teachings/:id` - Delete teaching (admin)
- `GET /teachings/:id/questions` - Get questions for teaching

#### Questions (`/questions`)

- `GET /questions?teachingId=` - List questions (filtered by teaching)
- `POST /questions` - Create question (admin)
- `GET /questions/:id` - Get question with delivery methods
- `DELETE /questions/:id` - Delete question (admin)
- `PUT /questions/:id/delivery-methods` - Replace delivery methods (admin)

### Progress Tracking (`/progress`)

#### `POST /progress/lessons/:lessonId/start`
- **Description**: Start or update lesson engagement
- **Auth**: Required
- **Response**: UserLesson object

#### `GET /progress/lessons`
- **Description**: Get user's lesson progress
- **Auth**: Required
- **Query**: `tzOffsetMinutes` (optional)
- **Response**: Array of user lessons with progress

#### `POST /progress/teachings/:teachingId/complete`
- **Description**: Mark teaching as completed
- **Auth**: Required
- **Response**: UserTeachingCompleted object

#### `POST /progress/questions/:questionId/attempt`
- **Description**: Record question attempt (append-only)
- **Auth**: Required
- **Body**: `QuestionAttemptDto`
- **Response**: UserQuestionPerformance object

#### `GET /progress/reviews/due`
- **Description**: Get all due reviews
- **Auth**: Required
- **Response**: Array of due review objects

#### `GET /progress/reviews/due/latest`
- **Description**: Get deduped due reviews (latest per question)
- **Auth**: Required
- **Response**: Array of deduped due reviews

#### `POST /progress/delivery-method/:method/score`
- **Description**: Update delivery method preference score
- **Auth**: Required
- **Body**: `DeliveryMethodScoreDto`
- **Response**: Updated score

#### `POST /progress/knowledge-level-progress`
- **Description**: Record XP progression
- **Auth**: Required
- **Body**: `KnowledgeLevelProgressDto`
- **Response**: Created progress record

#### `POST /progress/validate-answer`
- **Description**: Validate answer for a question
- **Auth**: Required
- **Body**: `ValidateAnswerDto`
- **Response**: `ValidateAnswerResponseDto` (isCorrect, score, feedback)

#### `POST /progress/validate-pronunciation`
- **Description**: Validate pronunciation
- **Auth**: Required
- **Body**: `ValidatePronunciationDto` (audioBase64, referenceText)
- **Response**: `PronunciationResponseDto` (score, accuracy, completeness, fluency, wordAnalysis)

### Learning Orchestration (`/learn`)

#### `GET /learn/next?lessonId=`
- **Description**: Get next item in lesson (deprecated, use session-plan)
- **Auth**: Required
- **Query**: `lessonId` (required)
- **Response**: Next item object (type: review/new/done)

#### `GET /learn/suggestions`
- **Description**: Get lesson/module suggestions
- **Auth**: Required
- **Query**: `currentLessonId`, `moduleId`, `limit` (optional)
- **Response**: Suggestions object (lessons[], modules[])

#### `GET /learn/session-plan`
- **Description**: Get complete learning session plan
- **Auth**: Required
- **Query**: 
  - `mode` (optional): 'learn' | 'review' | 'mixed'
  - `timeBudgetSec` (optional): number
  - `lessonId` (optional): string
  - `moduleId` (optional): string
  - `theme` (optional): string
- **Response**: `SessionPlanDto` (steps[], metadata)

#### `GET /learn/learning-path`
- **Description**: Get learning path cards with progress
- **Auth**: Required
- **Response**: Array of `LearningPathCardDto`

#### `GET /learn/review-summary`
- **Description**: Get review summary
- **Auth**: Required
- **Response**: `ReviewSummaryDto`

### Onboarding (`/onboarding`)

#### `POST /onboarding`
- **Description**: Save onboarding answers
- **Auth**: Required
- **Body**: `SaveOnboardingDto`
- **Response**: `OnboardingResponseDto`

#### `GET /onboarding`
- **Description**: Get onboarding answers
- **Auth**: Required
- **Response**: `OnboardingResponseDto` or null

#### `GET /onboarding/has`
- **Description**: Check if user has completed onboarding
- **Auth**: Required
- **Response**: Boolean

### Search (`/search`)

#### `GET /search`
- **Description**: Search content
- **Auth**: Optional
- **Query**: `q` (search query)
- **Response**: Search results

### Health (`/health`)

#### `GET /health`
- **Description**: Health check
- **Auth**: Not required
- **Response**: Health status

---

## Testing & Quality Assurance

### Backend Testing

#### Unit Tests
- **Location**: `backend/src/**/*.spec.ts`
- **Framework**: Jest
- **Coverage**: Unit tests for services, controllers, utilities
- **Examples**:
  - `session-planning.policy.spec.ts`: Session planning algorithm tests
  - `progress.service.spec.ts`: Progress service tests
  - `users.service.spec.ts`: User service tests

#### E2E Tests
- **Location**: `backend/test/`
- **Framework**: Jest + Supertest
- **Coverage**: End-to-end API tests

#### Test Commands
```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Test coverage
```

### Mobile Testing

#### Unit Tests
- **Location**: `mobile/src/__tests__/`
- **Framework**: Jest + React Native Testing Library
- **Coverage**: Component tests, utility tests, API tests
- **Examples**:
  - `HomeScreen.test.tsx`: Home screen component tests
  - `auth-flow.test.ts`: Authentication flow tests
  - `onboarding-mapper.test.ts`: Onboarding utility tests
  - `progress.test.ts`: Progress API tests

#### Test Commands
```bash
npm test              # Unit tests
npm run ci            # Lint + type-check + tests
```

### Code Quality

#### Linting
- **ESLint**: Code linting for both backend and mobile
- **Prettier**: Code formatting
- **TypeScript**: Type checking

#### Quality Checks
- **Type Safety**: Full TypeScript coverage
- **Validation**: Input validation on all endpoints
- **Error Handling**: Comprehensive error handling
- **Accessibility**: WCAG compliance checks

---

## Deployment & Configuration

### Backend Deployment

#### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fluentia

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_ANON_KEY=your-anon-key (optional)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)

# Azure Speech Services
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-region
AZURE_SPEECH_DEFAULT_LOCALE=it-IT

# Server
PORT=3000
NODE_ENV=production

# Rate Limiting
THROTTLE_TTL=60000 (1 minute)
THROTTLE_LIMIT=100 (production) / 1000 (development)
THROTTLE_USER_LIMIT=200

# CORS
CORS_ORIGIN=https://your-domain.com,https://app.your-domain.com

# Body Size Limit
BODY_LIMIT=15mb
```

#### Database Migrations
```bash
npm run prisma:generate
npm run prisma:migrate:deploy  # Production
npm run prisma:migrate:dev     # Development
```

#### Build & Start
```bash
npm run build
npm run start:prod
```

### Mobile Deployment

#### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Build Process
```bash
# iOS
expo build:ios
# or
eas build --platform ios

# Android
expo build:android
# or
eas build --platform android
```

#### App Configuration
- **app.config.ts**: Expo configuration
- **app.json**: App metadata
- **package.json**: Dependencies and scripts

### Production Considerations

#### Backend
- **Connection Pooling**: Prisma with connection pool
- **Rate Limiting**: Global rate limiting enabled
- **Security Headers**: OWASP recommended headers
- **Error Handling**: Production error messages limited
- **Logging**: Request logging middleware
- **Swagger**: API documentation at `/api`

#### Mobile
- **Caching**: Screen-level and session plan caching
- **Offline Support**: Limited (cached data available)
- **Error Boundaries**: Error handling for crashes
- **Performance**: Optimized rendering and data loading
- **Accessibility**: Full WCAG AA compliance

---

## Conclusion

Fluentia is a comprehensive language learning platform that combines modern mobile development with a robust backend API. The system provides:

- **Adaptive Learning**: Personalized content delivery based on user performance
- **Multiple Modalities**: 6 different delivery methods for varied learning
- **Intelligent Algorithms**: FSRS spaced repetition and BKT skill mastery
- **Comprehensive Tracking**: Detailed progress tracking at all levels
- **Modern Architecture**: Feature-first mobile app, modular backend
- **Security**: JWT authentication, input validation, rate limiting
- **Accessibility**: WCAG AA compliant, full screen reader support
- **Scalability**: Efficient database design, caching, connection pooling

The platform demonstrates best practices in:
- Full-stack TypeScript development
- RESTful API design
- Mobile app architecture
- Database design and optimization
- Algorithm implementation (FSRS, BKT)
- User experience design
- Security and authentication
- Testing and quality assurance

---

**End of Report**

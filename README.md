# Fluentia - Language Learning Platform

A comprehensive language learning application consisting of a mobile React Native app and a NestJS backend API. The platform provides personalized language learning experiences with adaptive content delivery, progress tracking, and multiple learning modalities.

## Project Overview

Fluentia is a dissertation project that combines modern mobile development with a robust backend API to deliver an engaging language learning experience. The system supports multiple knowledge levels (A1-C2), various delivery methods (flashcards, multiple choice, speech-to-text, etc.), and tracks user progress through modules, lessons, and teachings.

## Repository Structure

```
Dissertation/
├── backend/          # NestJS API server with Prisma ORM
├── mobile/           # React Native + Expo mobile application
└── README.md         # This file
```

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript

### Mobile
- **Framework**: React Native with Expo
- **Routing**: Expo Router
- **Backend Integration**: Supabase
- **Language**: TypeScript
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn
- For mobile development:
  - iOS: Xcode (for iOS Simulator)
  - Android: Android Studio (for Android Emulator)
  - Or Expo Go app on a physical device

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the `backend/` directory (see `.env.example` for template):
```
DATABASE_URL="postgresql://user:password@localhost:5432/fluentia"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_JWT_SECRET="your-jwt-secret-here"
SUPABASE_ANON_KEY="your-anon-key-here"  # Optional
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"  # Optional
PORT=3000
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

**Important**: The backend uses Supabase Auth for authentication. All authenticated endpoints require a valid Supabase JWT token in the `Authorization: Bearer <token>` header.

For more details, see [backend/README.md](./backend/README.md)

### Mobile Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the `mobile/` directory with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run start
```

5. Run on a platform:
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

For more details, see [mobile/README.md](./mobile/README.md)

## Key Features

### Learning System
- **Modular Structure**: Modules → Lessons → Teachings → Questions
- **Knowledge Levels**: A1, A2, B1, B2, C1, C2 (CEFR standard)
- **Multiple Delivery Methods**: 
  - Fill in the blank
  - Flashcards
  - Multiple choice
  - Speech-to-text
  - Text-to-speech
  - Text translation

### User Features
- **Supabase Authentication**: JWT-based authentication with server-side verification
- **User Provisioning**: Automatic user creation via `GET /me` endpoint
- **Progress Tracking**: 
  - Lesson engagement and completion
  - Teaching completion markers
  - Question performance logs (append-only)
  - Spaced repetition scheduling
- **Knowledge Level Progression**: XP tracking and level advancement
- **Performance Analytics**: Dashboard with due reviews, active lessons, and XP totals
- **Adaptive Learning**: Delivery method preference scores for personalized content delivery
- **Learning Orchestration**: Smart "next item" algorithm prioritizing reviews over new content

### Mobile App Features
- Onboarding flow for personalized experience
- Home dashboard with learning progress
- Lesson browsing and completion
- Practice tools (flashcards, listening, typing)
- Profile management with achievements
- Settings for preferences and speech

## Database Schema

The backend uses Prisma to manage a PostgreSQL database with the following main entities:

### Content Hierarchy
- **Module**: Top-level learning units
- **Lesson**: Individual lessons within modules
- **Teaching**: Learning content items with knowledge levels (A1-C2)
- **Question**: Practice questions linked to teachings
- **QuestionDeliveryMethod**: Join table linking questions to delivery methods

### User & Progress
- **User**: User accounts with progress tracking (id matches Supabase auth.users.id)
- **UserLesson**: Tracks lesson engagement and completion per user
- **UserTeachingCompleted**: Immutable markers for completed teachings
- **UserQuestionPerformance**: Append-only log of question attempts with spaced repetition
- **UserDeliveryMethodScore**: Adaptive preference scores per delivery method
- **UserKnowledgeLevelProgress**: XP/level progression over time

See [backend/prisma/schema.prisma](./backend/prisma/schema.prisma) for the complete schema.

## API Endpoints

### Authentication
All authenticated endpoints require a Supabase JWT token in the `Authorization: Bearer <token>` header.

### Identity & User (Authenticated)
- `GET /me` - User provisioning entrypoint (upserts user from JWT)
- `PATCH /me` - Update user preferences
- `GET /me/dashboard` - Get dashboard stats (due reviews, active lessons, XP)
- `GET /me/lessons` - Get user's started lessons with progress

### Content (Public reads, authenticated writes)
- **Modules**: `GET /modules`, `POST /modules`, `GET /modules/:id`, `PATCH /modules/:id`, `DELETE /modules/:id`, `GET /modules/:id/lessons`
- **Lessons**: `GET /lessons?moduleId=`, `POST /lessons`, `GET /lessons/:id`, `PATCH /lessons/:id`, `DELETE /lessons/:id`, `GET /lessons/:id/teachings`
- **Teachings**: `GET /teachings?lessonId=`, `POST /teachings`, `GET /teachings/:id`, `PATCH /teachings/:id`, `DELETE /teachings/:id`, `GET /teachings/:id/questions`
- **Questions**: `GET /questions?teachingId=`, `POST /questions`, `GET /questions/:id`, `DELETE /questions/:id`, `PUT /questions/:id/delivery-methods`

### Progress (All Authenticated)
- `POST /progress/lessons/:lessonId/start` - Start/update lesson engagement
- `GET /progress/lessons` - Get user's lesson progress
- `POST /progress/teachings/:teachingId/complete` - Mark teaching as completed
- `POST /progress/questions/:questionId/attempt` - Record question attempt (append-only)
- `GET /progress/reviews/due` - Get all due reviews
- `GET /progress/reviews/due/latest` - Get deduped due reviews (latest per question)
- `POST /progress/delivery-method/:method/score` - Update delivery method preference score
- `POST /progress/knowledge-level-progress` - Record XP progression

### Learning Orchestration (Authenticated)
- `GET /learn/next?lessonId=<uuid>` - Get next item in lesson (reviews → new → done)
- `GET /learn/suggestions?currentLessonId=&moduleId=&limit=` - Get lesson/module suggestions

For detailed API documentation, see [backend/README.md](./backend/README.md)

## Development

### Code Quality

Both projects include:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Jest for testing

### Running Tests

**Backend:**
```bash
cd backend
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Test coverage
```

**Mobile:**
```bash
cd mobile
npm test              # Unit tests
npm run ci            # Lint + type-check + tests
```

### Contributing

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make your changes
3. Run tests and linting: `npm run ci` (in respective directory)
4. Commit your changes
5. Push and create a Pull Request

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

This project is part of a dissertation and is not licensed for public use.

## Support

For questions or issues, please refer to the individual README files in the `backend/` and `mobile/` directories.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## Fluentia Backend API

### Auth Flow + /me Provisioning

The backend uses **Supabase Auth** as the only identity provider. Authentication works as follows:

1. **JWT Verification**: Every authenticated endpoint uses `SupabaseAuthGuard` which:
   - Extracts the JWT token from the `Authorization: Bearer <token>` header
   - Verifies the token using Supabase's JWT secret
   - Extracts the user ID from the `sub` claim
   - Attaches `req.user = { id: userId }` to the request

2. **User Provisioning**: User provisioning is **business-layer only** (no database triggers):
   - The canonical entrypoint is `GET /me`
   - On first call, it upserts a `User` record with `id = authUid` (from JWT `sub`)
   - `User.id` has NO default value - it must equal `auth.users.id` from Supabase
   - Subsequent calls return the existing user

3. **Data Ownership**: All progress operations are scoped to `req.user.id`:
   - Client NEVER supplies `userId` in payloads
   - User ID is derived from JWT only
   - All progress tables enforce user scoping

### Learn/Next Semantics

The `GET /learn/next?lessonId=<uuid>` endpoint is the **single source of truth** for "what's next" within a chosen lesson. It follows this algorithm:

1. **Validate & Ensure UserLesson**: 
   - Validates `lessonId` is present
   - Upserts `UserLesson` if it doesn't exist (implicitly starts the lesson)

2. **Prioritize Due Reviews**:
   - Finds all questions in the lesson
   - Identifies which are due (`nextReviewDue <= now`)
   - Deduplicates by question (keeps latest attempt per question)
   - If due reviews exist, returns `type="review"` with the question + teaching payload

3. **Return New Content**:
   - If no due reviews, finds the next unanswered or least-practiced question
   - Returns `type="new"` with question + teaching payload

4. **Done State**:
   - If all questions are completed, returns `type="done"`

5. **Delivery Method Suggestion**:
   - Uses `UserDeliveryMethodScore` preferences if available
   - Falls back to first available delivery method for the question
   - Returns `suggestedDeliveryMethod` in response

**Response Shape**:
```typescript
{
  type: "review" | "new" | "done",
  lessonId: string,
  teachingId?: string,
  question?: {
    id: string,
    teachingId: string,
    deliveryMethods: DELIVERY_METHOD[]
  },
  suggestedDeliveryMethod?: DELIVERY_METHOD,
  rationale?: string
}
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_JWT_SECRET`: JWT secret for token verification (from Supabase Dashboard)
- `SUPABASE_ANON_KEY`: Optional, for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Optional, for admin operations (fallback for JWT verification)

Azure Speech (pronunciation assessment):
- `AZURE_SPEECH_KEY`: Azure Speech subscription key
- `AZURE_SPEECH_REGION`: Azure Speech region (e.g. `westeurope`)
- `AZURE_SPEECH_DEFAULT_LOCALE`: Optional (default `it-IT`)

### Key Design Principles

1. **Append-Only Logs**: `UserQuestionPerformance` is append-only (never updated, always inserted)
2. **Immutable Markers**: `UserTeachingCompleted` is immutable (insert once, never updated)
3. **Idempotency**: Progress operations are idempotent (calling twice doesn't duplicate data)
4. **Transactional Integrity**: Multi-write operations use Prisma transactions
5. **Cascade Deletes**: Content hierarchy (Module→Lesson→Teaching→Question) uses cascade deletes

### Database Seeding

The seed script populates minimal test data for end-to-end testing of a basic Italian lesson.

**Run migrations:**
```bash
npm run prisma:migrate
```

**Run seed:**
```bash
npm run seed
# or
npx prisma db seed
```

**Test data created:**
- **Module**: "Italian Basics" - Essential Italian phrases and greetings
- **Lesson**: "Greetings & Essentials" - Basic greetings and essential phrases
- **3 Teaching items**:
  - "Ciao" → "Hi / Bye" (A1 level)
  - "Grazie" → "Thank you" (A1 level)
  - "Per favore" → "Please" (A1 level)
- **6 Practice questions** with various delivery methods:
  - Multiple choice (EN→IT)
  - Translation (IT→EN and EN→IT)
  - Fill-in-the-blank
  - Listening (Speech-to-text)

The seed uses deterministic UUIDs and upsert logic, so it's safe to run multiple times without creating duplicates.

### Content Management

All content is stored directly in the database (Prisma/Supabase). Question-specific data (options, answers, hints, prompts) is stored in the `questions.question_data` JSON field.

**Database Schema:**
- `modules`: Module metadata (title, description, imageUrl)
- `lessons`: Lesson metadata (title, description, imageUrl, moduleId)
- `teachings`: Teaching content (userLanguageString, learningLanguageString, emoji, tip)
- `questions`: Questions linked to teachings, with `question_data` JSON field containing:
  - `multipleChoice`: options, correctOptionId, explanation, sourceText, audioUrl
  - `translation`: source, answer, hint, audioUrl
  - `fillBlank`: text, answer, hint, audioUrl, options
  - `listening`: audioUrl, answer
- `question_delivery_methods`: Links questions to delivery methods

**Content Creation:**
Content should be created directly in the database via:
- Prisma Studio: `npm run prisma:studio`
- Direct database queries
- Admin API endpoints (if implemented)

**Note:** The content importer script (`scripts/import-content.ts`) is deprecated. All content should be managed directly in the database.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

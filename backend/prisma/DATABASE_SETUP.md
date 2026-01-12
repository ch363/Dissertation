# Database Setup Guide

## Understanding the Process

**Important:** Supabase already created your PostgreSQL database. Prisma doesn't create the database itself - it creates the **tables** inside your existing Supabase database based on your schema.

## Step-by-Step Setup

### 1. Get Your Supabase Connection Strings

From your Supabase dashboard:
- Go to **Settings** → **Database**
- Copy the **Connection string** (for pooled connections)
- Copy the **Direct connection** string (for migrations)

### 2. Create `.env` File

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://postgres.afkbjwxnujtokmfiketi:[YOUR-PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.afkbjwxnujtokmfiketi:[YOUR-PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```

**Replace `[YOUR-PASSWORD]` with your actual Supabase database password.**

### 3. Create Tables in Your Database

You have two options:

#### Option A: Quick Setup (Development) - `prisma db push`
This pushes your schema directly to the database without creating migration files. Good for prototyping:

```bash
npm run prisma:push
```

#### Option B: Production-Ready (Recommended) - `prisma migrate`
This creates migration files that track schema changes over time:

```bash
npm run prisma:migrate
```

When prompted, give your migration a name like `init` or `initial_schema`.

### 4. Generate Prisma Client

After creating tables, generate the Prisma Client:

```bash
npm run prisma:generate
```

Or it will auto-generate when you run migrations.

## What Gets Created

Based on your schema, Prisma will create these tables in your Supabase database:

- `modules` - Learning modules
- `lessons` - Lessons within modules
- `teachings` - Teaching content
- `questions` - Questions for teachings
- `question_delivery_methods` - Question delivery method mappings
- `users` - User accounts
- `user_delivery_method_scores` - User performance scores
- `user_knowledge_level_progress` - User progress tracking
- `user_lessons` - User lesson completion tracking
- `user_teachings_completed` - Completed teachings
- `user_question_performance` - Question performance data

Plus the enums: `KNOWLEDGE_LEVEL` and `DELIVERY_METHOD`

## Verify It Worked

1. **Check Supabase Dashboard:**
   - Go to **Table Editor** in Supabase
   - You should see all your tables listed

2. **Or use Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```
   This opens a visual database browser at `http://localhost:5555`

## Common Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Push schema changes (no migration files)
npm run prisma:push

# Apply migrations in production
npm run prisma:migrate:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Troubleshooting

**Error: "Cannot resolve environment variable: DATABASE_URL"**
- Make sure your `.env` file exists in the `backend` directory
- Check that the connection strings are correct
- Verify your Supabase password is correct

**Error: "Connection refused" or "Connection timeout"**
- Check your Supabase project is active
- Verify the connection strings match your Supabase region
- Make sure your IP is allowed in Supabase (Settings → Database → Connection Pooling)

# Dissertation App

A minimal, production-ready Next.js + TypeScript scaffold for your new app.

## Quick start

1) Install dependencies

```bash
npm ci
```

2) Run the dev server

```bash
npm run dev
```

Then open http://localhost:3000. Try the health endpoint at `/api/health`.

## Configuration

- Copy `.env.example` to `.env.local` and fill in values as needed. Public vars must be prefixed with `NEXT_PUBLIC_`.
- Project uses ESLint and Prettier. CI runs lint, type-check, and build on pushes/PRs to `main`.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm start` – Start production server
- `npm run lint` – Lint the project
- `npm run type-check` – TypeScript type checking

## Structure

- `src/app` – App Router pages and API routes
- `src/app/api/health` – Health check endpoint
- `public` – Static assets

## Next steps

- Define your domain models and API routes under `src/app/api/*`.
- Add UI components and pages under `src/app/*`.
- If integrating Notion or other services, add a server-only SDK client in `src/lib/` and wire env vars via `.env.local`.

run
# From /workspaces/Dissertation
npm ci
npm run dev

build
npm run build
npm start
# Quorum

A multi-tenant application for running monthly department meetings: the dept head starts the meeting, a randomly drawn note-taker compiles the minutes, each named owner confirms their own points, the dept head approves, and unfinished points carry over automatically.

Full specification: [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md). Working rules: [CLAUDE.md](CLAUDE.md).

**Status:** Phase 1, milestone M0 (foundation) complete.

## Requirements
- Node.js 22 or newer
- Docker Desktop (for PostgreSQL and the Mailpit mail catcher)

## Run it locally

```bash
# 1. configuration (never commit .env)
cp .env.example .env
#    then edit .env: set POSTGRES_PASSWORD (and the same value inside DATABASE_URL),
#    a JWT_ACCESS_SECRET of 32+ random characters, and the bootstrap owner email/password.

# 2. database + mail catcher
docker compose up -d

# 3. backend (http://localhost:3000/api)
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate     # applies migrations
npm run start:dev

# 4. frontend (http://localhost:5173), in a second terminal
cd frontend
npm install
npm run dev
```

On first start, if no users exist, the API creates one **Platform Owner** from `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_PASSWORD`. That account must change its password at first sign-in. Nothing is hard-coded.

- App: http://localhost:5173
- Health check: http://localhost:3000/api/health
- Mail inbox (development): http://localhost:8025

## Checks

```bash
cd backend  && npm test && npx nest build
cd frontend && npm run lint && npm run build
```

## Layout
- `backend/`: NestJS API (modules, pure rule classes in `src/rules/`, Prisma schema)
- `frontend/`: React app (feature folders, design tokens in `src/design/`)
- `docs/`: specification
- `docker-compose.yml`: local PostgreSQL and Mailpit

## Deployment notes
- Frontend: Vercel. `frontend/vercel.json` handles page routing; add a rewrite sending `/api/*` to the deployed backend URL so the refresh cookie stays same-origin.
- Backend and PostgreSQL: chosen at deployment time (see the open item in the spec's decisions log).

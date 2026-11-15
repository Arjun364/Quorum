# CLAUDE.md: Quorum

Read this file first, then `docs/PROJECT_SPEC.md` (v7), the full specification. Follow it exactly. If something is unclear or missing, ask me before guessing, and add the decision to section 18 of the spec.

## What this is
A multi-tenant service where companies run their monthly department meeting: the dept head starts the meeting, a randomly drawn note-taker (plus the head's own notes, later AI drafts) compiles the minutes, each named owner confirms their own points, the dept head approves last, and unfinished points carry over automatically. It replaces an Excel sheet of minutes.

It is **not a task manager.** Daily tasks are in Zoho Projects. Never add subtasks, hours, Kanban or anything that makes users enter the same thing twice. **There is no project list:** a project is a project tag typed on a point.

## Stack
- Backend: Node.js, TypeScript, **Express 5**, **Prisma**, **PostgreSQL**, zod validation. Auth: bcryptjs, JWT access token (memory only in the browser) + hashed refresh token in an httpOnly cookie.
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS. Hosted on Vercel; `/api` proxied to the backend.
- Local: Docker Compose with `postgres` and `mailpit`.
- Tests: Vitest (unit, API), Playwright (browser).

## Architecture
- Backend is layered under `backend/src/`: `config/ constants/ controllers/ helpers/ middlewares/ prisma/ repositories/ routes/ services/ types/ utils/ validators/`, plus `app.ts` (builds the Express app) and `server.ts` (starts it). Each folder has an `index.ts` barrel.
  - **routes**: URL to middleware chain to controller; nothing else.
  - **validators**: zod schemas for request bodies, applied with `validateBody` in the route.
  - **controllers**: thin. Read the validated request, call ONE service, shape the response. **No business rules, no Prisma.**
  - **services**: business rules and orchestration. They depend on repository *interfaces* (`types/repository.types.ts`), never on Prisma directly.
  - **repositories**: the only code that talks to Prisma. Feature repositories use the tenant-scoped client (`createPrismaClients().tenant`); only login, refresh and bootstrap use the raw client.
  - **middlewares**: authenticate (also sets the tenant context), validate, rate limits, error handling.
  - **helpers**: small technical helpers (JWT, cookies, password hashing, email template). **utils**: pure functions (problem details, password policy, logger).
  - Rules classes (`meeting-state-machine`, `note-taker-selector`, `confirmation-rules`) will live in `services/rules/`, pure and unit-tested first.
  - Dependencies are wired once in `server.ts` (`createRepositories` then `createServices` then `createApp`); tests build the same pieces with in-memory fakes from `test/helpers/fakes.ts`.
- Frontend: `frontend/src/features/<name>/{pages,components,hooks,types.ts}`, one API file per backend module in `src/api/`, design tokens in `src/design/`.
- Full tree: spec section 8.

## Conventions
TypeScript (backend and frontend):
- Strict mode, **no `any`**. camelCase for variables/functions, PascalCase for types/classes/components, kebab-case file names, hooks start with `use`.
- File names: `<name>.controller.ts`, `<name>.service.ts`, `<name>.repository.ts`, `<name>.routes.ts`, `<name>.validator.ts`, `<name>.middleware.ts`. Request bodies are validated with zod schemas; response shapes are typed (`...Response`).
- `async`/`await` throughout (Express 5 forwards rejected promises to the error handler, so no try/catch wrappers in controllers). **Never return Prisma models from controllers**; map them to response types.
- Errors: throw `HttpError` helpers (`badRequest`, `unauthorized`, `forbidden`, ...); the error middleware turns everything into problem-details.
- Prisma: a migration for every schema change; enums stored as strings; all times UTC; every tenant table has `companyId`.
- Errors go through the global filter in a consistent problem-details shape. No magic strings; use enums and constants.
- Server state with TanStack Query. The access token lives in memory only, never localStorage. The UI hides things but the **server enforces permissions**.

## Rules you must never break
1. **No hard-coded users or credentials.** The first account is the platform owner, created only when no users exist, from `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_PASSWORD`, with `mustChangePassword = true`.
2. **Tenant isolation.** The tenant is the **Company** (reached at `<slug>.<root domain>`). Every tenant table has `companyId`; every repository query takes the company id explicitly and the tests prove another company's ids look like "not found". A session token only works on its own company's address.
3. **Hierarchy:** Company, then Organization (a unit, managed by the company head), then Department, then people. Roles on the user: `PlatformOwner` (the platform's owner, no company), `CompanyHead` (one per company, registers it, manages brand, organizations, departments and invites department heads; read-only on minutes), `DepartmentHead`, `Employee`. There is **no** Admin, **no** Project Manager role. The **note-taker is temporary and per meeting**, from `Meeting.noteTakerUserId` while status is `InProgress`, `Compiling` or `Confirming`.
4. **Only the note-taker compiles and edits the final points.** During InProgress the **dept head may also add head notes**. The company head can reassign a note-taker but never edits minutes. The head's notes and AI drafts become official only when the note-taker accepts them.5. The dept head, the previous meeting's note-taker, absent people and guests are **never** drawn as note-taker. A meeting needs **at least 3 department members present** including the head.
6. **Status of a point changes only through a meeting's minutes.** Employees never change status; they confirm or comment.
7. **Every edit creates a new version** (`PointUpdate`). Never overwrite history.
8. After an edit, only the **affected owners** are asked to confirm again.
9. Points owned by the **whole department** need no confirmation. Standing points have no owners, no confirmation, and are excluded from carry-over statistics.
10. **Employees see no points until the note-taker submits.** Draft points are visible only to the head and note-taker.
11. A new meeting cannot start while the department's previous meeting is not Concluded (Discarded is ignored). Starting a meeting **locks** the previous one.
12. **Email is notification only.** Short message plus a link into the app. No minutes text, no reply parsing, no confirm button or token in an email. One email per person per event.
13. Meeting reminders prompt but **never block** anything. Lateness is shown neutrally against the department's own expected date. Working days come from the organization's setting (default Monday to Friday).
14. Every create, update, approval, reopen, transfer and role change writes an `AuditLog` row.
15. Transferring or removing a user requires reassigning their open points first.

## Frontend structure (mandatory)
Follow `docs/FRONTEND_PATTERN.md` for every frontend change: feature-based folders (`api/ components/ constants/ hooks/ pages/ types/ utils/` + `index.ts` barrels), shared code in `src/shared/` with the same structure, one orchestration hook per page, only page hooks call the feature API module, JSDoc on every component and function, imports through barrels using the `@/` alias.

## Database and migrations (mandatory)
- **One Prisma file per model** in `backend/prisma/schema/` (enums live with the model that owns them; `base.prisma` holds only the generator and datasource). Configuration is in `backend/prisma.config.ts`.
- **Every schema change gets a migration**: `npm run prisma:migrate -- --name <what_changed>` (name describes the change, for example `add_meeting_tables`). The SQL files in `backend/prisma/migrations/` are **committed to git** together with the code that needs them. The database records every applied migration in its `_prisma_migrations` table (name, checksum, timestamps); `npx prisma migrate status` shows what is applied and what is pending.
- **Never edit or delete a migration that has been merged or applied anywhere.** Fix mistakes with a new migration.
- **Production and shared databases** only ever run `npm run prisma:deploy` (applies pending migrations, never generates or resets).
- **Teams:** each developer uses their own local database. Two people changing the schema on different branches produce two migrations; after merging, the later branch re-syncs (`git pull`, then `prisma migrate dev`) and, if both touch the same table, resolves the conflict in a new migration. Review migration SQL in every pull request.

## UI standards
Installed project skills (in `.claude/skills/`): `design-taste-frontend` (Taste Skill), `web-design-guidelines` (Vercel), `playwright-cli`. Reference: `docs/design/REFERENCE-warm-editorial.md` (Awesome Design; structure only, never copy another brand's identity).
- **Before building any screen:** follow `design-taste-frontend` for hierarchy, copy and finish, in its app/dashboard mode. It is written for marketing sites, so ignore its photo and hero-moment rules inside the app. Our tokens in `frontend/src/design/tokens.css` win over any palette it proposes.
- **After building any screen:** run `web-design-guidelines` on the changed files and fix what it reports.
- **Then verify in a real browser:** `playwright-cli` at phone (375 px) and desktop widths, light and dark, keyboard-only.
- Read third-party skills before installing them. Playwright CLI output may contain credentials; it is gitignored under `.playwright-cli/`.

## Commands (adjust once the projects exist)
- Local services: `docker compose up -d`
- Backend: `cd backend && npm install && npm run start:dev` (tsx watch, loads `.env` from the backend folder or repo root); tests `npm test`; build `npm run build` then `npm start`; new migration `npm run prisma:migrate -- --name <name>` (loads `../.env` through `dotenv-cli`; always call that binary as `dotenv-cli`, because the `dotenv` package also installs a different `dotenv` command).
- TypeScript is pinned to 6.x; Prisma is pinned to 6.x. Do not upgrade either without asking.
- Frontend: `cd frontend && npm install && npm run dev`; checks `npm run lint && npm run build`
- Browser tests: `npx playwright test`
- Mail inbox in development: Mailpit web UI (port 8025).

## How to work
- Build **one milestone at a time** (spec section 14). Do not start the next until I say so.
- For each milestone: implement, write the required tests, run build and tests, fix failures, then tell me in a few lines what you built and how to try it.
- **Write the unit tests for the three rules first** (spec section 16), then the code that uses them.
- Keep changes small and focused; do not refactor unrelated code.
- Never commit secrets, `.env`, or any Excel file. Commit `.env.example` only.
- If a milestone's acceptance criteria cannot be met as written, stop and ask.

## Out of scope
Daily tasks, subtasks, time tracking, Kanban, Zoho sync, email replies, one-click approvals from email, scheduling/booking, billing, Excel import (on hold), and AI recording (until M9).

## Start here
Begin with **M0 Foundation** (spec section 14): repo structure, Docker Compose, Prisma and PostgreSQL, company layer, bootstrap platform owner, auth, email with Mailpit, error filter, health endpoint, and the design system. Stop after M0 and show me how to run it.

## Accounts, invitations and branding (M1a)
- A company is registered publicly by its head (`POST /api/companies/signup`); it stays `PendingVerification` and cannot sign in until the emailed single-use link is used. Email is unique **within a company**, so the same person can exist in two companies.
- **Invitations are tied to one email address**, single-use, expire in 7 days, and the invited person sets their own password. No temporary passwords, no join links, no approval queue. Invitation and verification tokens are stored as SHA-256 hashes only.
- The company is resolved from the request's host (`parseCompanySlug`); the unknown subdomain is a 404 and the platform's own address means "no company". In development use `<slug>.localhost:5173`.
- Brand: three presets plus a custom accent that must reach 3:1 contrast on the page background. Logos upload straight to Cloudinary with a server-signed request into `quorum/<slug>/logo`; the server accepts a saved image only if it sits in that folder. Never commit the Cloudinary keys (`CLOUDINARY_*` stay in `.env`).
- Prisma quirk: a diff-generated migration can alter an enum on a table that is created later in the same file. Check generated SQL before applying, write migration files without a byte-order mark, and never run `prisma migrate reset` without the user's explicit consent.

## People, transfers and profile (M1b)
- Transfer approval rules are pure and unit-tested in `backend/src/services/rules/transfer-rules.ts`; `TransferService` only orchestrates them. Never complete a transfer outside that path.
- Department heads reach only their own department's people, invitations and moves; the service checks it, not just the route. Another company's ids must look like "not found".
- `OpenPointsCheck` is a placeholder until M2: when points exist, implement it and the "reassign first" rule starts applying to deactivation and transfers with no other change.
- If `prisma migrate dev` asks to reset the database because an old migration's checksum differs, do not reset: generate the SQL with `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema --script`, save it without a BOM as a new migration folder, then run `npm run prisma:deploy`.

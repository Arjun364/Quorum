# CLAUDE.md: Department Application

Read this file first, then `docs/PROJECT_SPEC.md` (v7), the full specification. Follow it exactly. If something is unclear or missing, ask me before guessing, and add the decision to section 18 of the spec.

## What this is
A multi-tenant service where organizations run their monthly department meeting: the dept head starts the meeting, a randomly drawn note-taker (plus the head's own notes, later AI drafts) compiles the minutes, each named owner confirms their own points, the dept head approves last, and unfinished points carry over automatically. It replaces an Excel sheet of minutes.

It is **not a task manager.** Daily tasks are in Zoho Projects. Never add subtasks, hours, Kanban or anything that makes users enter the same thing twice. **There is no project list:** a project is a project tag typed on a point.

## Stack
- Backend: Node.js, TypeScript, **NestJS**, **Prisma**, **PostgreSQL**. Auth: argon2/bcrypt, JWT access token (memory only in the browser) + hashed refresh token in an httpOnly cookie.
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS. Hosted on Vercel; `/api` proxied to the backend.
- Local: Docker Compose with `postgres` and `mailpit`.
- Tests: Vitest (unit, API), Playwright (browser).

## Architecture
- `backend/src/modules/<feature>/`: thin `*.controller.ts`, `*.service.ts`, `dto/`. Controllers validate, authorize (guards), call a service, return a DTO. **No business rules in controllers.**
- `backend/src/rules/`: pure, unit-tested `meeting-state-machine.ts`, `note-taker-selector.ts`, `confirmation-rules.ts`.
- `backend/src/common/`: guards, error filter, tenant context.
- Frontend: `frontend/src/features/<name>/{pages,components,hooks,types.ts}`, one API file per backend module in `src/api/`, design tokens in `src/design/`.
- Full tree: spec section 8.

## Conventions
TypeScript (backend and frontend):
- Strict mode, **no `any`**. camelCase for variables/functions, PascalCase for types/classes/components, kebab-case file names, hooks start with `use`.
- Classes end with `Controller`/`Service`/`Guard`; DTOs end with `Request`/`Response` and are validated (class-validator or zod).
- `async`/`await` throughout. **Never return Prisma models from controllers**; map to DTOs.
- Prisma: a migration for every schema change; enums stored as strings; all times UTC; every table has `organizationId`.
- Errors go through the global filter in a consistent problem-details shape. No magic strings; use enums and constants.
- Server state with TanStack Query. The access token lives in memory only, never localStorage. The UI hides things but the **server enforces permissions**.

## Rules you must never break
1. **No hard-coded users or credentials.** The first account is the platform owner, created only when no users exist, from `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_PASSWORD`, with `mustChangePassword = true`.
2. **Tenant isolation.** Every table has `organizationId`; every query is filtered centrally by the signed-in user's organization. A cross-organization read must be impossible and covered by tests.
3. Roles on the user: `PlatformOwner`, `Admin`, `CompanyHead`, `DepartmentHead`, `Employee`. There is **no** Project Manager role. The **note-taker is temporary and per meeting**, from `Meeting.noteTakerUserId` while status is `InProgress`, `Compiling` or `Confirming`.
4. **Only the note-taker compiles and edits the final points.** During InProgress the **dept head may also add head notes**. Admin can reassign a note-taker but never edits minutes. The head's notes and AI drafts become official only when the note-taker accepts them.
5. The dept head, the previous meeting's note-taker, absent people and guests are **never** drawn as note-taker. A meeting needs **at least 3 department members present** including the head.
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

## UI standards
Before building any screen, use the installed design skills (Taste Skill, Web Design Guidelines, Awesome Design, Image to Code when mockups exist) and the tokens in `frontend/src/design/`. Check every screen with Playwright at phone and desktop widths. Read third-party skills before installing them.

## Commands (adjust once the projects exist)
- Local services: `docker compose up -d`
- Backend: `cd backend && npm install && npm run start:dev`; tests `npm test`; migration `npx prisma migrate dev --name <name>`
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
Begin with **M0 Foundation** (spec section 14): repo structure, Docker Compose, Prisma and PostgreSQL, organization layer, bootstrap platform owner, auth, email with Mailpit, error filter, health endpoint, and the design system. Stop after M0 and show me how to run it.

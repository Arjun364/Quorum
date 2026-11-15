# Department Application: Project Specification (v7)

This is the complete specification. Build exactly what is written here. If something is unclear or missing, ask before guessing, and record the decision in section 17.

Last updated: 2026-11-15. v7 supersedes v6: Node.js/PostgreSQL stack, multi-tenant, new meeting flow (head notes, Compiling status), tags-only projects, join links, department transfers.

---

## 1. What this application is

A multi-tenant service used by organizations to run their **monthly department meeting**. It replaces an Excel sheet of meeting minutes. The platform owner hosts it; each organization is isolated from every other.

It is **not a task manager.** Daily tasks live in Zoho Projects. This app only records what was decided and the status of points and projects *at each meeting*. Never add subtasks, hours, Kanban boards, or anything that makes users enter the same information twice.

In one line: the dept head starts a meeting, a randomly drawn note-taker (with the head's own notes, and later AI drafts) compiles the minutes, each named owner confirms their own points, the dept head approves last, and unfinished points carry over automatically.

### Terms
- **Organization (tenant):** one company using the platform. All data belongs to exactly one organization.
- **Point:** one item from a meeting (an action or an announcement). It lives across meetings; each meeting adds a version.
- **Standing point:** an item discussed in every meeting (for example, phone use). Created once, copied into every new meeting.
- **Project:** *not a separate list.* A project is a **project tag** typed on a point. It appears in every later meeting's previous points until it is marked Completed.
- **Note-taker:** a temporary role for one meeting. One attendee, drawn at random, who compiles the minutes.
- **Head notes:** points and notes the dept head adds himself during the meeting. The note-taker sees them as he adds them.
- **Owner:** an employee a point is assigned to.
- **Confirmation:** an owner's check that what the minutes say about their point is correct.
- **Concluded:** the dept head has approved the meeting. The note-taker role ends.
- **Locked:** the next meeting has started. A concluded meeting can no longer be changed.

---

## 2. Principles (never break these)

1. **No hard-coded users.** All users, departments, organizations and roles are in the database. The first account is the platform owner, created by a one-time bootstrap (section 11).
2. **No double work.** Projects are tags typed once on a point; there is no project list to maintain. An optional Zoho link may sit on a project tag.
3. **Status changes only through meeting minutes,** and only the note-taker compiles them.
4. **Nobody approves their own words.** Owners confirm what is written about them; the dept head approves the whole.
5. **Every version of a point is kept.** Never overwrite history.
6. **Actions happen in the app,** never by email reply or a button inside an email. Emails only point people to the app.
7. **The server enforces all permissions and all organization isolation.** The UI only hides things.
8. **Fixed status lists.**
9. **Meetings are recommended, not enforced.** Reminders prompt; they never block anything.
10. **Tenant isolation:** every table carries `organizationId`; every query is filtered by the signed-in user's organization. A cross-organization read must be impossible and tested.

---

## 3. Roles

System roles (stored on the user): `PlatformOwner`, `Admin` (organization admin), `CompanyHead`, `DepartmentHead`, `Employee`.

The **note-taker is not a user role.** It is derived from `Meeting.noteTakerUserId` and is valid only for that meeting, from the draw until the dept head concludes it.

There is no Project Manager role.

| Capability | Platform owner | Admin | Company Head | Dept Head | Note-taker (that meeting) | Employee |
|---|---|---|---|---|---|---|
| Create/disable organizations | Yes | No | No | No | No | No |
| Manage users, departments, roles (own org) | No | Yes | No | Add/remove members of own dept only | No | No |
| Approve join requests | No | Yes | No | Yes (own dept) | No | No |
| See meetings and points | No (no tenant data) | All, once minutes are submitted | All (read-only), once submitted | Own dept, always | Own dept | Own dept (read-only), once submitted |
| Department settings | No | Yes | No | Yes (own dept) | No | No |
| Start a meeting, mark attendees, end the meeting | No | Yes | No | Yes (own dept) | No | No |
| Reassign note-taker (logged, reason) | No | Yes | No | Yes | No | No |
| Standing points | No | Yes | No | Yes | No | No |
| Create project/general tags | No | Yes | No | Yes | Yes | No |
| Rename/merge tags | No | Yes | No | Yes | No | No |
| Add points during the meeting | No | No | No | Yes (head notes) | Yes | No |
| Compile and edit the final points | No | No | No | No | Yes | No |
| Confirm or comment on own points | n/a | n/a | n/a | Own points | Own points (auto-confirmed) | Own points |
| Approve, return, reopen, force-conclude, discard | No | Yes | No | Yes | No | No |
| See analytics | No | All | All | Own dept | No | No |

Rules:
- A user belongs to **at most one department** at a time (department may be empty for Admin/CompanyHead/PlatformOwner). People from other departments join a meeting as **guests** (`isGuest = true`).
- Admin can reassign a note-taker but does **not** edit minutes. The company head is read-only.
- Employees see all points of their own department read-only, but only **after the note-taker submits** the minutes. During the live meeting and Compiling they see only that a meeting is in progress, the attendees and the note-taker.
- Employees can comment only on their own points.

---

## 4. Core flow

### 4.1 Starting a meeting (there is no scheduling)
1. The dept head opens **New meeting**. Date and time default to now and are editable.
2. The page loads the **previous open points** (not Done/Cancelled) and active **standing points**. He can switch a standing point off for this meeting.
3. The department's members are pre-ticked as attendees. He unticks the absent and can add guests.
4. **A meeting needs at least 3 department members present, including the head.** Guests do not count. Otherwise the server rejects the start.
5. On Save, the system **draws a note-taker at random from the department members present**:
   - never the previous meeting's note-taker,
   - never the dept head,
   - never an absent person or a guest,
   - among the rest, prefer whoever served least recently (weighted random, so two people do not alternate).
   With 3 present members this always leaves at least one eligible person, so there is no manual-pick fallback; the selector still returns "none eligible" and the server rejects the start if that ever happens.
6. A re-draw is allowed only with a written reason and is logged (`NoteTakerDraw`).
7. A new meeting **cannot start** while the department's previous meeting is not Concluded or Discarded. The dept head can force-conclude it (4.7).
8. Starting a meeting locks the previous concluded meeting for good.
9. A meeting started by mistake can be **discarded** by the head or admin while InProgress (logged). A discarded meeting is ignored when finding the "previous" meeting.

### 4.2 During the meeting (InProgress)
- Other employees see only that a meeting is **in progress**, the attendees and the note-taker. They do **not** see any points.
- The **dept head** and the **note-taker** can both add points. The head's entries go in a **Head notes** section the note-taker sees as they are added.
- The note-taker's screen has four parts:
  1. **Standing points:** mark each discussed, optional note.
  2. **Previous points:** each pre-filled; change status and comment only for what was discussed.
  3. **Project round:** for each active project tag, record stage, comment and next step.
  4. **New points and announcements:** text, owner(s), due date, tags.
- A point owned by the **whole department** is an announcement/policy. It has no individual owner and needs no confirmation.
- Every save creates a new version of the point (`PointUpdate`).
- (Phase 2) After the meeting, AI drafts points from the recording as a third source.

### 4.3 Ending the meeting and compiling
- When the discussion is over, the **dept head ends the meeting**. Status becomes **Compiling**.
- The note-taker now merges **three sources** into the final points: their own notes, the head's notes, and (Phase 2) the AI draft. Nothing from the head's notes or the AI becomes an official point until the note-taker accepts it.
- The note-taker submits. Status becomes **Confirming**.

### 4.4 Submitting and the first message
- **Everyone** in the department and the guests are notified that the minutes are ready (in-app plus one email) and can now read the full minutes read-only.
- Each owner of at least one **new or changed** point also gets a confirmation request in the **same** email.
- People who own nothing new or changed get information only. Untouched carried-over points are not re-confirmed.
- The note-taker's own points are auto-confirmed.

### 4.5 Confirmation loop
The employee logs in and, on the **My points** page, for each point either:
- **Confirms:** it is correct, or
- **Comments:** it is wrong or not done, with a short message. The comment goes only to the note-taker.

The note-taker edits the point (new version). The update goes **only to the affected owners.** If an edit changes the owner of a point, the new owner is asked to confirm and the old owner is told it is no longer theirs.

Timings (defaults, editable per department, **working days = the organization's working days, default Monday to Friday**):
- Reminder after **2 working days** without an answer.
- Flag **NoResponse** after **4 working days.**
- A point with **3 comment rounds** is marked **Disputed** and shown to the dept head.

### 4.6 Sending to the dept head
The note-taker can send the minutes to the dept head when every owner has confirmed, **or** when the NoResponse deadline has passed (unconfirmed points stay flagged). Status becomes **HeadReview.**

### 4.7 Head review, conclusion, carry-over
The dept head sees: new, changed, disputed and unconfirmed points, and each owner's confirmation state. He can:
- **Approve:** Concluded.
- **Return** with a **change request on each point** that needs it. Status becomes Confirming. Changed points go back to their owners for confirmation only, then to the head again.
- **Dismiss** an employee's comment on a Disputed point (logged), recording the final text.

His own points are confirmed as part of his approval.

On conclusion:
- The note-taker role ends. The expected next-meeting date is set (4.9).
- Every point not Done/Cancelled **passes to the next meeting** as a previous point. `carryOverCount` increases by one for each concluded meeting that reviewed a point without closing it. Points with `carryOverCount >= 2` are flagged.
- A project tag stays active until it is marked **Completed**.
- The head can **reopen** a concluded meeting (logged) only until the next meeting starts; status becomes HeadReview.
- The head can **force-conclude** a meeting stuck in Confirming; unconfirmed points are flagged NoResponse.
- Once the next meeting starts, the previous one is **locked.**

### 4.8 Standing points
Created once, at department setup or later in settings. Each new meeting copies the active ones in. The dept head can switch one off for a meeting, retire it, or add/edit one at any time. Standing points are excluded from carry-over counts and statistics, have no owners and need no confirmation.

### 4.9 Department settings and reminders
Set by the dept head or admin:
- **Expected next meeting date.** Default: one month after the last concluded meeting. Editable any time with an optional reason the company head can see.
- **Reminder before:** days before the expected date that a reminder goes to the dept head.
- **Overdue reminders:** if no meeting has started by the expected date, remind every N days up to a maximum.
- **Confirmation timings:** days to first reminder (2), days to NoResponse (4), comment rounds before Disputed (3).
- These never block a meeting. Reminders run from one daily scheduled job.
- A read-only **calendar view** shows past meetings and the expected next date. It does not schedule anything.

### 4.10 Tags and projects
- Every point carries tags: a **project tag** or a **general tag** (ISO, Training, Policy...).
- A project is created simply by typing a new project tag on a point. There is no project list and no manual project creation. A project tag has: Name, Stage, Status (Active or Completed), optional Zoho URL.
- The tag input autocompletes and warns on near-duplicates (typos split history). The dept head can rename or merge tags.
- Opening a project tag shows its complete history across meetings in date order.
- Active project tags appear in the note-taker's project round at every meeting until marked Completed.

### 4.11 Users, join links, transfers
- Every user has an email (required, unique within the platform) and a role. Users are created by the Admin, or join through a **department join link**.
- A join link is created by the dept head or admin, **pre-fills the department**, expires, and can be revoked. The person registers and verifies their email, then stays **Pending until the dept head or admin approves.** Pending users see nothing.
- The dept head and admin can add or remove members of the department. Removal and transfer require reassigning the person's open points first.
- **Transfer between departments** (started by admin or either head): the system lists the person's open owned points; they must be reassigned before the move completes; pending confirmations are cancelled; old minutes keep the old department; a department head cannot move until a replacement head is named. Every transfer is logged.
- Leaving the organization = deactivate (never delete); history is kept. A deactivated user cannot be the current note-taker; reassign first.

---

## 5. Meeting state machine

```
InProgress ─end meeting (head)─▶ Compiling ─submit─▶ Confirming ─send to head─▶ HeadReview ─approve─▶ Concluded ─next meeting starts─▶ (Locked)
                                                         ▲                          │  │
                                                         └───────────return─────────┘  │
                                                                                         │
                                                      HeadReview ◀─────reopen────────────┘ (only until locked)

InProgress ─discard─▶ Discarded
Confirming ─force-conclude─▶ Concluded
```

`Locked` is `Meeting.lockedAt` being set, not a status. Illegal transitions must throw. This logic lives in one place with unit tests. The note-taker may write in InProgress, Compiling and Confirming only; the head may add head notes in InProgress only.

---

## 6. Email and notifications

- **Sender:** one service mailbox per deployment (organization-specific sender later). SMTP is configured at deployment time; development uses Mailpit.
- **The email never carries the decision.** Short message plus a link to the right screen. No reply parsing, no confirm/approve buttons or tokens.
- **Minimal content:** counts and meeting name, not minutes text.
- **One email per person per event,** never one per point.
- **In-app inbox:** every user has a "waiting for me" list.
- Log every attempt in `EmailLog`; failures must not break the flow.

| Event | Who gets it |
|---|---|
| Minutes ready + confirmation request (combined) | Everyone in department and guests; owners also get "please confirm" |
| Comment received | Note-taker |
| Point updated after a comment or edit | Affected owner(s) only |
| Confirmation reminder / NoResponse flag | The owner; flag also to note-taker |
| Ready for head review | Dept head |
| Returned / concluded | Note-taker |
| Join request | Dept head (or admin) |
| Upcoming / overdue meeting reminder | Dept head |

---

## 7. Technology

- **Backend:** Node.js with TypeScript, **NestJS** (modules, controllers, services, guards), **Prisma** ORM, **PostgreSQL**.
- **Auth:** email + password (argon2 or bcrypt), JWT access token (about 15 minutes) kept in memory in the browser, refresh token in an httpOnly cookie, hashed in the database, long-lived (about 30 days) so email links open straight into the app. Account lockout after repeated failures.
- **Authorization:** NestJS guards with resource checks (section 10).
- **Email:** Nodemailer over SMTP; Mailpit in development.
- **Scheduled work:** a daily job (reminders, NoResponse flags) exposed as a job that can run from a host cron or an authenticated scheduled endpoint. Must be safe to run twice (`ReminderLog` de-duplication).
- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS. Hosted on Vercel; `/api` is proxied to the backend so cookies stay same-origin.
- **Local development:** Docker Compose with `postgres`, `mailpit` (and optionally `api`). Production hosting is chosen at deployment time.
- **Tests:** Vitest (unit and API), Playwright (browser flows).
- **IDs:** UUID or int primary keys (decision: int autoincrement for readability). **Enums** as strings. **Times** stored in UTC, shown in the organization's time zone (default Asia/Kolkata).

---

## 8. Project structure

```
department-app/
├── CLAUDE.md
├── README.md
├── docker-compose.yml                 postgres, mailpit (+ api optional)
├── .env.example
├── docs/PROJECT_SPEC.md
├── backend/                           NestJS API
│   ├── package.json, tsconfig.json, nest-cli.json
│   ├── prisma/ schema.prisma, migrations/, seed (bootstrap only)
│   ├── src/
│   │   ├── main.ts, app.module.ts
│   │   ├── common/                    guards, decorators, filters (ProblemDetails-style errors), tenant context
│   │   ├── rules/                     PURE, unit-tested:
│   │   │   ├── meeting-state-machine.ts
│   │   │   ├── note-taker-selector.ts
│   │   │   └── confirmation-rules.ts
│   │   ├── modules/                   each: *.controller.ts (thin), *.service.ts, dto/
│   │   │   ├── auth/  organizations/  users/  departments/  join-links/
│   │   │   ├── settings/  standing-points/  tags/
│   │   │   ├── meetings/  meeting-draft/  confirmations/  head-review/
│   │   │   ├── notifications/  email/  reminders/  dashboards/
│   └── test/                          rules tests, API permission and isolation tests
└── frontend/
    ├── package.json, vite.config.ts, vercel.json
    └── src/ app/, api/, components/, design/ (tokens), features/<name>/{pages,components,hooks,types.ts}
```

Controllers validate input (DTO), call a guard and a service, and return a DTO. **Business rules never live in controllers.**

---

## 9. Data model

Every table: `id`, `organizationId` (except Organization), `createdAt`, and `createdBy` where sensible.

- **Organization:** name, slug, meetingLanguage (Malayalam, English, Mixed), timeZone, workingDays, isActive
- **Department:** name, code, headUserId, isActive. **Source of truth for the head is `headUserId`; the DepartmentHead role is set and cleared with it in one transaction.**
- **DepartmentSettings:** departmentId, expectedNextMeetingDate, expectedDateReason, reminderDaysBefore, overdueRepeatEveryDays, overdueMaxReminders, confirmReminderDays, confirmFlagDays, disputeAfterRounds
- **User:** name, email (unique), departmentId (nullable), systemRole, status (Pending, Active, Inactive), mustChangePassword, password hash, lockout fields
- **RefreshToken:** userId, tokenHash, expiresAt, revokedAt
- **DepartmentJoinLink:** departmentId, tokenHash, expiresAt, revokedAt
- **DepartmentTransfer:** userId, fromDepartmentId, toDepartmentId, initiatedBy, at
- **Tag:** name, kind (Project, General), departmentId (null = organization-wide); for project tags: stage, status (Active, Completed), zohoUrl
- **Meeting:** departmentId, title, startedAt, medium, location, status, noteTakerUserId, previousMeetingId, endedAt, submittedAt, concludedAt, lockedAt
- **MeetingAttendee:** meetingId, userId, attendance (Present, Online, Absent), isGuest
- **NoteTakerDraw:** meetingId, drawnUserId, reason, createdBy, createdAt
- **StandingPoint:** departmentId, text, sortOrder, isActive
- **MeetingStandingPoint:** meetingId, standingPointId, isIncluded, discussed, note
- **MeetingPoint:** departmentId, originMeetingId, text, raisedByUserId, dueDate, currentStatus, carryOverCount, kind (Action, Announcement), ownerScope (People, WholeDepartment), isDisputed, source (Manual, HeadNote, AiDraft)
- **HeadNote:** meetingId, text, createdBy, createdAt, acceptedPointId (nullable)
- **PointOwner**, **PointTag**
- **PointUpdate:** pointId, meetingId, version, status, comment, newDueDate, editedBy, createdAt (every version kept)
- **MeetingPointReview:** meetingId, pointId (records points reviewed without change, for carry-over)
- **PointConfirmation:** meetingId, pointId, userId, version, state (Pending, Confirmed, Commented, NoResponse), respondedAt
- **PointComment:** pointId, meetingId, userId, kind (EmployeeComment, NoteTakerReply, HeadChangeRequest), text, dismissedAt, createdAt
- **ProjectStatusUpdate:** tagId, meetingId, stage, comment, nextStep
- **HeadReview:** meetingId, reviewedBy, decision (Approved, Returned, Reopened, ForceConcluded, Discarded), comment, at
- **Notification:** userId, type, text, link, readAt, createdAt
- **EmailLog:** userId, type, subject, sentAt, status, error
- **ReminderLog:** type, targetKey, sentAt (prevents duplicate reminders)
- **AuditLog:** userId, action, entityType, entityId, timestamp, details

Fixed lists:
- Point status: `Open`, `InProgress`, `OnHold`, `Done`, `Cancelled`
- Project stage: `Requirement`, `Development`, `UAT`, `Live`, `OnHold`, `Closed`
- Meeting status: `InProgress`, `Compiling`, `Confirming`, `HeadReview`, `Concluded`, `Discarded`

The official view of a meeting shows the latest version of each point as of that meeting.

---

## 10. Authorization

Server-side guards plus resource checks, always against database records:
- Role guards: `PlatformOwnerOnly`, `AdminOnly`, `DepartmentHeadOrAdmin`, etc.
- `SameOrganization`: every query is scoped by the signed-in user's `organizationId` (central tenant filter, not repeated by hand).
- `SameDepartment`: user's department equals the resource's department (admin and company head excepted for reads).
- `IsNoteTaker`: user id equals `Meeting.noteTakerUserId` **and** status is `InProgress`, `Compiling` or `Confirming`.
- `IsPointOwner`: user is in `PointOwner` for that point.
- Draft visibility: points of a meeting in `InProgress` or `Compiling` are visible only to the head and note-taker.
- The note-taker has no write rights after the meeting is Concluded.

---

## 11. Bootstrap and security

- On first start, **only if no users exist**, create one `PlatformOwner` from `BOOTSTRAP_OWNER_EMAIL` and `BOOTSTRAP_OWNER_PASSWORD`, with `mustChangePassword = true`. The platform owner creates organizations; each organization gets its own Admin. **Never hard-code credentials; never commit real secrets.**
- Password policy, lockout, hashed refresh tokens, rate limiting on auth routes.
- Every create, update, approval, reopen, transfer and role change writes an `AuditLog` row.
- Validate all input. Never return database models directly; map to DTOs.
- Never include minutes text in emails.

---

## 12. API outline (proposed)

All routes under `/api`. JSON. Errors use a consistent problem-details shape.

| Area | Routes |
|---|---|
| Auth | `POST auth/login`, `refresh`, `logout`, `change-password`, `register` (via join link), `verify-email`; `GET auth/me` |
| Organizations (platform owner) | `GET/POST organizations`, `GET/PUT organizations/{id}`, `POST organizations/{id}/admin` |
| Users | `GET/POST users`, `GET/PUT users/{id}`, `POST users/{id}/deactivate`, `POST users/{id}/reset-password`, `POST users/{id}/transfer` |
| Departments | `GET/POST departments`, `GET/PUT departments/{id}`, `GET departments/{id}/members`, `POST/DELETE departments/{id}/members/{userId}` |
| Join links | `POST departments/{id}/join-links`, `DELETE .../{linkId}`, `GET join-requests`, `POST join-requests/{id}/approve`, `.../reject` |
| Dept settings | `GET/PUT departments/{id}/settings` |
| Standing points | `GET/POST departments/{id}/standing-points`, `PUT .../{spId}`, `POST .../{spId}/retire` |
| Tags | `GET/POST tags`, `PUT tags/{id}`, `POST tags/{id}/merge`, `POST tags/{id}/complete`, `GET tags/{id}/history` |
| Meetings | `GET meetings`, `GET meetings/{id}`, `GET meetings/start-preview`, `POST meetings`, `POST meetings/{id}/redraw`, `POST meetings/{id}/end`, `POST meetings/{id}/discard` |
| Meeting draft | `GET meetings/{id}/draft`, `POST meetings/{id}/head-notes`, `PUT meetings/{id}/standing-points/{spId}`, `PUT meetings/{id}/points/{pointId}`, `POST meetings/{id}/points`, `PUT meetings/{id}/project-updates/{tagId}`, `POST meetings/{id}/submit`, `POST meetings/{id}/send-to-head`, `POST points/{id}/reply` |
| Confirmations | `GET confirmations/mine`, `POST confirmations/{id}/confirm`, `.../comment` |
| Head review | `GET meetings/{id}/review-summary`, `POST meetings/{id}/approve`, `.../return`, `.../reopen`, `.../force-conclude`, `POST comments/{id}/dismiss` |
| Notifications | `GET notifications`, `POST notifications/{id}/read`, `GET inbox` |
| Dashboards | `GET dashboards/company`, `GET dashboards/department/{id}` |

---

## 13. Dashboards (Phase 2)

Everything is "as of the last concluded meeting."
- **Lateness is shown neutrally** next to each department's own expected date and postponement reason.
- **Company head:** meetings concluded, confirmation turnaround, Disputed and NoResponse counts, points opened/closed per meeting, points carried over 2+ times, project stage trend.
- **Dept head:** open points by tag, project status across meetings, who owns what, who has been note-taker.

---

## 14. Phases, milestones and acceptance criteria

Build one milestone at a time. Finish, test and summarize before starting the next.

### Phase 1: replaces the Excel sheet

**M0 Foundation**
- Repo, folders per section 8, `docker compose up` runs postgres and mailpit; API runs locally.
- Prisma migrations apply; bootstrap platform owner per section 11.
- Organization layer and the central tenant filter exist.
- Login, logout, refresh, change-password; `mustChangePassword` enforced.
- Email sender works against Mailpit; `EmailLog` records it.
- Error filter, health endpoint.
- **Design system:** design direction chosen, tokens and base components built (section 15).

**M1 Org and access**
- Platform owner creates organizations and their admin.
- Admin manages users, departments, dept head. Join links with approval; member add/remove; transfers with reassignment check.
- Tests: another organization or department cannot be read.
- Role-specific home screens with a "waiting for me" placeholder.

**M2 Tags, standing points, settings**
- Project and general tags (autocomplete, near-duplicate warning, rename, merge, complete); standing points; department settings.

**M3 Start a meeting**
- Start-preview, attendees, minimum-3 rule, note-taker draw with unit tests for `NoteTakerSelector`, re-draw with reason, blocked while previous meeting is open, discard.

**M4 Live meeting and compiling**
- Only the head and note-taker can write during InProgress; everyone else gets 403 and sees no points.
- Head notes visible to the note-taker. End meeting → Compiling. Versions, project round, new tagged points.
- Submit creates `PointConfirmation` rows via `ConfirmationRules`.

**M5 Confirmation loop**
- My points page; confirm/comment; comments reach the note-taker; edits notify only affected owners.
- Daily job: reminders, NoResponse, Disputed. Combined email per person; in-app inbox.

**M6 Head review, conclusion**
- Review summary, approve, return with per-point change requests, reopen, force-conclude, dismiss disputed comment.
- Carry-over, `carryOverCount`, locking, meeting reminder and overdue emails, calendar view.

**Pilot:** one real meeting in one department before anything else is built.

### Phase 2: better and shared
- **M7 Dashboards.**
- **M8 Export** of concluded minutes to PDF or Excel. (Excel **import is on hold**; never commit the Excel file, it holds real client data.)
- **M9 AI recording:** audio → transcript → draft points as the third source in Compiling; organization `meetingLanguage` (Malayalam) feeds transcription; Malayalam quality must be tested on real recordings first. Output is always reviewed; needs recording consent.
- **Deployment** for other organizations (hosting, SMTP, backups). Portfolio presentation comes after the product works.

---

## 15. UI standards

- Before building any screen, follow the installed design skills (Taste Skill, Web Design Guidelines, Awesome Design reference style, Image to Code when mockups exist) and the design tokens in `frontend/src/design/`.
- Verify each screen with Playwright at phone and desktop widths. Accessible, fast, no cluttered screens; the note-taker screen must be keyboard-friendly with autosave.

---

## 16. Rules that must have unit tests first

1. `MeetingStateMachine`: every allowed and forbidden transition, including Compiling, reopen, lock, discard.
2. `NoteTakerSelector`: excludes previous note-taker, dept head, absentees and guests; favours least recent; returns "none eligible".
3. `ConfirmationRules`: who must confirm after submit, who is re-asked after an edit, owner change, whole-department points, auto-confirmed note-taker.

---

## 17. Out of scope

Daily tasks, subtasks, time tracking, Kanban, Zoho synchronization, replying to emails, one-click approvals from email, scheduling or calendar booking, billing, AI recording (until M9), Excel import (on hold).

---

## 18. Decisions log

- 2026-11-15: Dept head is never drawn as note-taker.
- 2026-11-15: Standing points are per department.
- 2026-11-15: Emails carry no minutes text, only a message and a link.
- 2026-11-15: Meeting lateness shown neutrally against the department's own expected date.
- 2026-11-15: Stack changed from .NET/SQL Server to Node.js (NestJS) + Prisma + PostgreSQL for easier hosting; data is relational.
- 2026-11-15: Multi-tenant (shared database, `organizationId` on every table, central tenant filter), hosted by the platform owner.
- 2026-11-15: Projects are project tags only; no project list or manual project creation. Active until marked Completed.
- 2026-11-15: Minimum 3 department members present (incl. head) to start; guests do not count and are never drawn; no manual note-taker fallback.
- 2026-11-15: No Cancelled status; mistaken meetings can be Discarded.
- 2026-11-15: Meeting has a Compiling status; head adds head notes; note-taker merges notes, head notes and (Phase 2) AI draft.
- 2026-11-15: Employees see minutes only after submit; draft visible only to head and note-taker.
- 2026-11-15: Working days default Monday to Friday, set per organization; daily scheduled job.
- 2026-11-15: Join links pre-fill the department; new user stays Pending until the head or admin approves.
- 2026-11-15: Dept head and admin can add/remove department members; transfers require reassigning open points.
- 2026-11-15: Head writes per-point change requests on Return and can dismiss a disputed employee comment (assumed; confirm).
- 2026-11-15: Meeting language is an organization setting (Malayalam); AI is Phase 2.
- 2026-11-15: Excel import on hold; SMTP provider chosen at deployment; portfolio presentation after the product is done.
- 2026-11-15 (M0): bcryptjs (pure JS, cost 12) is used for password hashing instead of argon2, to avoid native build problems on Windows. Password policy: 10 to 72 bytes, with upper, lower and digit.
- 2026-11-15 (M0): TypeScript is pinned to 6.x in both projects because the Nest CLI needs the compiler API that TypeScript 7.0 does not ship yet. Revisit when 7.1 is out.
- 2026-11-15 (M0): Prisma 6 is used (Prisma 7/8 changes configuration and drivers); upgrade deliberately later. Prisma enums are used for roles and statuses.
- 2026-11-15 (M0): Tenant isolation is enforced by a Prisma client extension (`PrismaService.tenant`) that forces `organizationId` into every query on tenant models and throws when no organization is in context. The raw client is used only for login, refresh and bootstrap.
- 2026-11-15 (M0): The refresh cookie is scoped to `/api/auth`, SameSite=Lax, httpOnly. Refresh tokens rotate; reuse of a rotated token revokes every session of that user. After 5 failed logins an account is locked for 15 minutes.
- 2026-11-15 (M0): The guard reloads the user from the database on every request, so deactivation and password-change requirements take effect immediately.
- Open: hosting choice for the API and database (decide at deployment); whether an email may belong to two organizations (currently no).

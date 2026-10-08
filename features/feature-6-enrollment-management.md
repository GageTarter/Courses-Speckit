<<<<<<< HEAD
# Feature: Section Enrollment

**Feature ID:** 6
**Branch pattern:** `feature/6-enrollment-management`
**Status:** Ready
**Created:** 2026-10-01
**Input:** A signed-in student picks a semester, browses the sections offered in it, and enrolls in the ones they want; they can review and drop their own enrollments
**Depends on:** [Feature 1 — User Authentication & Role-Based Access](./feature-1-user-auth.md)
**Related:** [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md), `features/reference/api.md`. Features 2, 3, and 5 add **admin CRUD** on the catalog tables this feature introduces — they must not create a second `courses` / `semesters` / `sections` schema.

---

## Catalog scaffold (so this feature can ship first)

Teammates do not have to finish Features 2, 3, and 5 before enrollment works. This feature **owns the minimum catalog schema and read APIs** enrollment needs. Admin create/update/delete for those tables stays out of scope.

| Endpoint | Owner | Shape |
|----------|-------|--------|
| `GET /courses/semesters` | This feature (handed to Feature 3 later) | `{ id, name }` |
| `GET /courses/sections?semesterId=N` | This feature (handed to Feature 5 later) | `{ id, sectionNumber, capacity, remainingSeats, semesterId, courseId, course: { id, code, title } }` |

- Sections are filtered with query param `semesterId` (not a nested route).
- Each section **embeds** the parent `course` object so the enroll view does not make a second request.
- Missing `semesterId` on `GET /courses/sections` → `400` `{ "message": "semesterId is required." }`
- Catalog rows in development/demo come from `npm run seed-catalog --prefix backend`. Tests insert their own rows. There is no public write API for catalog data in this feature.

---

## User Stories

### US-6.1: Choose a semester
**As a** signed-in student
**I want to** pick a semester from a list
**So that** I only see the sections actually offered in the term I am registering for

**Priority:** P1
**Independent test:** Select a semester and see the section list reload scoped to that semester
**Acceptance scenarios:** see ### US-6.1 under Acceptance Criteria

### US-6.2: Browse sections offered in the selected semester
**As a** signed-in student
**I want to** see each section's course code, title, section number, and remaining seats
**So that** I can decide which sections to enroll in

**Priority:** P1
**Independent test:** With a semester selected, the table lists its sections and shows remaining seats per row
**Acceptance scenarios:** see ### US-6.2 under Acceptance Criteria

### US-6.3: Enroll in a section
**As a** signed-in student
**I want to** enroll in a section with one click
**So that** my place in the class is recorded

**Priority:** P1
**Independent test:** Click **Enroll** on an open section and see it move into my schedule with a `201` from the API
**Acceptance scenarios:** see ### US-6.3 under Acceptance Criteria

### US-6.4: Review my enrollments for the semester
**As a** signed-in student
**I want to** see the sections I am already enrolled in for the selected semester
**So that** I know what my schedule looks like so far

**Priority:** P1
**Independent test:** Enroll in a section, reload the page, and still see it listed under my schedule
**Acceptance scenarios:** see ### US-6.4 under Acceptance Criteria

### US-6.5: Drop a section
**As a** signed-in student
**I want to** drop a section I enrolled in
**So that** I can correct a mistake and free the seat for someone else

**Priority:** P2
**Independent test:** Drop an enrollment and watch the section return to the available list with its seat count restored
**Acceptance scenarios:** see ### US-6.5 under Acceptance Criteria

### US-6.6: Keep enrollments private to the student
**As the** application
**I want to** scope every enrollment read and write to the signed-in student
**So that** no student can see or change another student's schedule

**Priority:** P1
**Independent test:** Request another student's enrollment id for deletion → `404`
**Acceptance scenarios:** see ### US-6.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: All enrollment screens and endpoints MUST require a valid session (Feature 1 `authenticate`).
- **FR-002**: A student MUST only be able to create enrollments for themselves. The server MUST take the owning user from `req.user.id` and MUST ignore any user identifier in the request body.
- **FR-003**: Only users with role `student` MUST be able to create or delete enrollments; an `admin` calling those endpoints receives `403`.
- **FR-004**: A student MUST NOT be enrolled in the same section twice. A duplicate attempt returns `400` with `{ "message": "You are already enrolled in this section." }`.
- **FR-005**: A student MUST NOT hold two enrollments for the same course within the same semester, even across different sections. A violation returns `400` with `{ "message": "You are already enrolled in another section of this course." }`.
- **FR-006**: A section MUST NOT accept more enrollments than its `capacity`. A full section returns `400` with `{ "message": "This section is full." }`.
- **FR-007**: Remaining seats MUST be derived as `capacity` minus the current enrollment count. The value MUST NOT be stored as a denormalized column on `sections`.
- **FR-008**: The sections list MUST be scoped to the selected semester; no semester selected means no section request is made.
- **FR-009**: A student MUST be able to delete only their own enrollment. Another student's enrollment id returns `404`, not `403`.
- **FR-010**: Dropping an enrollment MUST free the seat immediately, so the section's remaining-seat count increases on the next read.
- **FR-011**: Enrolling in or dropping a section MUST refresh both the available-sections list and the student's schedule, so seat counts on screen stay accurate.
- **FR-012**: Enrolling in a section whose id does not exist returns `404` with `{ "message": "Section with id=${id} not found." }`.

---

## Assumptions

- Feature 1 auth is on this branch (User, Session, `authenticate`, `requireAdmin`).
- Features 2, 3, and 5 may still be unwritten. This feature ships the catalog **tables and read APIs**; admin maintenance UIs remain theirs.
- A student self-registers through Feature 1; there is no separate `students` table — a student is a `users` row with role `student`.
- Registration windows, holds, prerequisites, and waitlists are not modelled; any section with a free seat is enrollable.
- Seat counts are computed per request. Two students racing for the last seat is handled by the unique constraint and capacity check, not by row locking.

## Edge Cases

- No semesters exist yet → the selector shows an empty state rather than an error.
- Semester selected but it has no sections → empty table with explanatory copy.
- Section fills between page load and the **Enroll** click → `400` "This section is full." and the list refreshes.
- Enrolling twice by double-clicking → the second request returns `400` (FR-004), and the button is disabled while the request is in flight.
- Deleting an enrollment id that does not exist at all → `404`, same as one owned by another student.
- A section whose capacity is reduced below its current enrollment count by an admin → remaining seats floor at `0`; existing enrollments are not evicted.
- An admin signing in and reaching the enroll route → the enroll actions are hidden and the API returns `403` if called directly.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A student can sign in, select a semester, enroll in a section, see it in their schedule, and drop it in one manual pass.
- **SC-003**: Two students enrolling in the same section each see the remaining-seat count decrease correctly.
- **SC-004**: A student cannot read or delete another student's enrollment through the API.
- **SC-005**: `npm test` passes with backend enrollment coverage and frontend enroll-view coverage.

---

## Data Ownership & Isolation

Each student owns their enrollments exclusively. Semesters, courses, and sections are shared read-only catalog data.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /courses/enrollments` returns only rows where `userId = req.user.id` |
| **Write scope** | Delete succeeds only when the row matches both `id` and `req.user.id` |
| **Create scope** | New enrollment rows are owned by the authenticated user; `userId` never comes from the request body |
| **Cross-user access** | Another student's enrollment → `404` (not `403`) |
| **Role guard** | Create and delete require role `student` → `403` for admins (role guard, distinct from the ownership `404`) |
| **Catalog data** | Semesters, courses, and sections are readable by any authenticated user. This feature has no public write API for them (seed script and tests only) |
| **UI scope** | The schedule panel renders only what `GET /courses/enrollments` returned for the signed-in student |
| **Implementation** | Ownership lookup lives in a shared helper in `backend/app/authorization/` — controllers must not duplicate the scope clause |

---

## API Requirements

Endpoints introduced by this feature:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/semesters` | Yes | List semesters for the selector |
| `GET` | `/courses/sections?semesterId=N` | Yes | List sections in that semester, with `remainingSeats` and embedded `course` |
| `GET` | `/courses/enrollments` | Yes | List the signed-in student's enrollments; optional `?semesterId=N` filter |
| `POST` | `/courses/enrollments` | Yes (student) | Enroll the signed-in student in a section |
| `DELETE` | `/courses/enrollments/:id` | Yes (student) | Drop one of the signed-in student's enrollments |

**Create request body:**
```json
{ "sectionId": 12 }
```

**Create success response** (`201`):
```json
{
  "id": 44,
  "userId": 7,
  "sectionId": 12,
  "enrolledAt": "2026-10-01T18:04:11.000Z"
}
```

**List success response** (`200`) — each row embeds the section and course needed to render a schedule row:
```json
[
  {
    "id": 44,
    "sectionId": 12,
    "enrolledAt": "2026-10-01T18:04:11.000Z",
    "section": {
      "id": 12,
      "sectionNumber": "001",
      "semesterId": 3,
      "course": { "id": 5, "code": "CMSC 4123", "title": "Software Engineering IV" }
    }
  }
]
```

**Delete success response:** `200` with `{ "message": "Enrollment dropped." }`

**Semester list** (`200`):
```json
[{ "id": 3, "name": "Fall 2026" }]
```

**Section list** (`200`) for `GET /courses/sections?semesterId=3`:
```json
[
  {
    "id": 12,
    "sectionNumber": "001",
    "capacity": 30,
    "remainingSeats": 2,
    "semesterId": 3,
    "courseId": 5,
    "course": { "id": 5, "code": "CMSC 4123", "title": "Software Engineering IV" }
  }
]
```

**Error response:** `{ "message": "Human-readable explanation." }`

| Status | Used for |
|--------|----------|
| `201` | Enrollment created |
| `200` | List and drop succeeded |
| `400` | Missing `sectionId`, duplicate section, duplicate course in semester, section full |
| `401` | Missing or expired token |
| `403` | Authenticated as `admin` on a create or delete |
| `404` | Section not found; enrollment not found or not owned |

---

## Screen Requirements

### [View: Enroll] — route name `enroll`
Single student-facing view with a selector, an available-sections table, and a schedule panel.

*   Heading: **Section Enrollment**
*   **Semester selector:** `<v-select>` labelled **Semester**, populated from `GET /courses/semesters`, with no default selection.
    *   Before a selection: **"Select a semester to see available sections."**
    *   No semesters exist: **"No semesters are open for registration yet."**
*   **Available sections table:** `<v-data-table>` with columns Course, Title, Section, Seats, and an action column.
    *   Seats renders as `remaining / capacity`.
    *   Primary action per row: **Enroll** (`<v-btn color="primary" variant="elevated" class="oc-cta" :loading="…">`), disabled while its request is in flight and when remaining seats are `0`.
    *   A full row shows a `<v-chip>` reading **Full** in place of the seat count's normal styling.
    *   Sections the student is already enrolled in are excluded from this table.
    *   **Empty state:** **"No sections are offered in this semester."**
*   **My schedule panel:** `<v-card rounded="lg">` titled **My Schedule**, listing the student's enrollments for the selected semester.
    *   Each row shows course code, title, and section number.
    *   Icon-only action: drop, with `aria-label` **Drop section**, opening a confirm dialog.
    *   Confirm dialog: title **Drop section?**, body naming the course, primary confirm **Drop** (`oc-cta`), secondary **Cancel** (`variant="text"`).
    *   **Empty state:** **"You are not enrolled in any sections for this semester."**
*   **Loading:** table and panel show `:loading` state while fetching.
*   **Error:** any failed request renders `<v-alert type="error" density="compact">` with the server message above the table.
*   **Role:** the view is reachable only by role `student`; the router guard redirects an `admin` to `home`.

**Router:** add the `enroll` route behind the Feature 1 authentication guard.

---

## Key Entities

- **Enrollment**: the link between one student and one section, created when the student enrolls and removed when they drop. Carries the moment of enrollment.
- **Section**: a scheduled offering of a course within a semester, with a seat capacity. Schema introduced here; admin CRUD deferred to Feature 5.
- **Semester**: the term a section belongs to. Schema introduced here; admin CRUD deferred to Feature 3.
- **Course**: the catalog entry a section offers. Schema introduced here; admin CRUD deferred to Feature 2.

---

## Data Model Requirements

This feature introduces four tables. Features 2, 3, and 5 extend the catalog tables; they must not replace them.

### `semesters` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required, unique |

### `courses` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `code` | STRING | Required, unique |
| `title` | STRING | Required |

### `sections` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `sectionNumber` | STRING | Required |
| `capacity` | INTEGER | Required, ≥ 1 |
| `semesterId` | INTEGER FK | Required, references `semesters.id` |
| `courseId` | INTEGER FK | Required, references `courses.id` |

### `enrollments` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `userId` | INTEGER FK | Required, references `users.id`; set from the session |
| `sectionId` | INTEGER FK | Required, references `sections.id` |
| `enrolledAt` | DATE | Required; defaults to row creation time |

**Constraints:** a unique composite index on (`userId`, `sectionId`) enforces FR-004 at the database level, so a race between two concurrent requests cannot create a duplicate.

### Associations
*   `User hasMany Enrollment`
*   `Enrollment belongsTo User`
*   `Semester hasMany Section`
*   `Course hasMany Section`
*   `Section belongsTo Semester`
*   `Section belongsTo Course`
*   `Section hasMany Enrollment`
*   `Enrollment belongsTo Section`

Associations are wired in `backend/app/models/index.js`.

---

## Acceptance Criteria (Gherkin)

### US-6.1 — Choose a semester

#### Scenario: Student selects a semester
*   **Given** I am signed in as a student on the enrollment page
*   **And** semesters **Fall 2026** and **Spring 2027** exist
*   **When** I select **Fall 2026** from the Semester selector
*   **Then** the available sections table loads the sections for **Fall 2026**
*   **And** sections belonging to **Spring 2027** are not listed

#### Scenario: Student has not selected a semester yet
*   **Given** I am signed in as a student on the enrollment page
*   **When** the page finishes loading
*   **Then** I see **"Select a semester to see available sections."**
*   **And** no section request has been sent

#### Scenario: No semesters exist
*   **Given** no semesters have been created
*   **When** I open the enrollment page
*   **Then** I see **"No semesters are open for registration yet."**

---

### US-6.2 — Browse sections offered in the selected semester

#### Scenario: Student sees remaining seats for each section
*   **Given** section **001** of **CMSC 4123** has a capacity of `30` and `28` enrollments
*   **When** I select its semester
*   **Then** the row for that section shows `2 / 30` seats

#### Scenario: Semester has no sections
*   **Given** semester **Spring 2027** exists with no sections
*   **When** I select **Spring 2027**
*   **Then** I see **"No sections are offered in this semester."**

#### Scenario: A full section cannot be enrolled in from the list
*   **Given** a section has a capacity of `1` and `1` enrollment
*   **When** I view it in the available sections table
*   **Then** the row shows a **Full** chip
*   **And** its **Enroll** button is disabled

---

### US-6.3 — Enroll in a section

#### Scenario: Student enrolls in an open section
*   **Given** I am signed in as a student
*   **And** section **001** of **CMSC 4123** has a free seat
*   **When** I click **Enroll** on that row
*   **Then** the API returns `201` with an enrollment containing my `userId` and the `sectionId`
*   **And** the section appears under **My Schedule**
*   **And** the section is removed from the available sections table

#### Scenario: Enrollment ignores a user id supplied in the request body
*   **Given** I am signed in as student A
*   **When** I POST an enrollment body containing a `userId` belonging to student B
*   **Then** the API returns `201`
*   **And** the created enrollment is owned by student A

#### Scenario: Student enrolls in a section twice
*   **Given** I am already enrolled in section **001** of **CMSC 4123**
*   **When** I POST an enrollment for that same section
*   **Then** the API returns `400` with `{ "message": "You are already enrolled in this section." }`
*   **And** no second enrollment row is created

#### Scenario: Student enrolls in a second section of the same course
*   **Given** I am enrolled in section **001** of **CMSC 4123** for **Fall 2026**
*   **And** section **002** of **CMSC 4123** also exists for **Fall 2026**
*   **When** I POST an enrollment for section **002**
*   **Then** the API returns `400` with `{ "message": "You are already enrolled in another section of this course." }`

#### Scenario: Student enrolls in a full section
*   **Given** a section has a capacity of `1` and one other student is enrolled
*   **When** I POST an enrollment for that section
*   **Then** the API returns `400` with `{ "message": "This section is full." }`
*   **And** no enrollment row is created for me

#### Scenario: Student enrolls without a section id
*   **Given** I am signed in as a student
*   **When** I POST an enrollment with no `sectionId`
*   **Then** the API returns `400` with `{ "message": "sectionId is required." }`

#### Scenario: Student enrolls in a section that does not exist
*   **Given** no section exists with id `9999`
*   **When** I POST an enrollment for section `9999`
*   **Then** the API returns `404`

#### Scenario: Admin cannot enroll
*   **Given** I am signed in as an admin
*   **When** I POST an enrollment for any section
*   **Then** the API returns `403`

#### Scenario: Unauthenticated enrollment request is rejected
*   **Given** I have no session token
*   **When** I POST an enrollment
*   **Then** the API returns `401`

---

### US-6.4 — Review my enrollments for the semester

#### Scenario: Student sees only their own enrollments
*   **Given** student A is enrolled in section **001** and student B is enrolled in section **002**
*   **When** student A requests `GET /courses/enrollments`
*   **Then** the response contains the enrollment for section **001**
*   **And** it does not contain the enrollment for section **002**

#### Scenario: Schedule is filtered by the selected semester
*   **Given** I am enrolled in one section in **Fall 2026** and one in **Spring 2027**
*   **When** I request `GET /courses/enrollments?semesterId=` for **Fall 2026**
*   **Then** only the **Fall 2026** enrollment is returned

#### Scenario: Student has no enrollments in the selected semester
*   **Given** I have no enrollments for **Spring 2027**
*   **When** I select **Spring 2027**
*   **Then** I see **"You are not enrolled in any sections for this semester."**

#### Scenario: Enrollment survives a page reload
*   **Given** I enrolled in section **001**
*   **When** I reload the enrollment page and select the same semester
*   **Then** section **001** is still listed under **My Schedule**

---

### US-6.5 — Drop a section

#### Scenario: Student drops a section
*   **Given** I am enrolled in section **001** of **CMSC 4123**
*   **When** I click the **Drop section** action and confirm **Drop**
*   **Then** the API returns `200`
*   **And** the section is removed from **My Schedule**
*   **And** the section reappears in the available sections table

#### Scenario: Dropping frees the seat
*   **Given** a section has a capacity of `30` and `30` enrollments including mine
*   **When** I drop my enrollment
*   **Then** a later read of that section reports `1 / 30` seats remaining

#### Scenario: Student cancels the drop confirmation
*   **Given** the drop confirmation dialog is open for section **001**
*   **When** I click **Cancel**
*   **Then** the dialog closes
*   **And** I am still enrolled in section **001**

---

### US-6.6 — Keep enrollments private to the student

#### Scenario: Student drops another student's enrollment
*   **Given** student B owns enrollment id `44`
*   **When** I am signed in as student A and send `DELETE /courses/enrollments/44`
*   **Then** the API returns `404`
*   **And** student B's enrollment still exists

#### Scenario: Student drops an enrollment that does not exist
*   **Given** no enrollment exists with id `9999`
*   **When** I send `DELETE /courses/enrollments/9999`
*   **Then** the API returns `404`

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-6.1 | Student selects a semester | `frontend/tests/Enroll.test.js` | `Student selects a semester` |
| US-6.1 | Student has not selected a semester yet | `frontend/tests/Enroll.test.js` | `Student has not selected a semester yet` |
| US-6.1 | No semesters exist | `frontend/tests/Enroll.test.js` | `No semesters exist` |
| US-6.2 | Student sees remaining seats for each section | `backend/tests/enrollments.test.js`, `frontend/tests/Enroll.test.js` | `Student sees remaining seats for each section` |
| US-6.2 | Semester has no sections | `frontend/tests/Enroll.test.js` | `Semester has no sections` |
| US-6.2 | A full section cannot be enrolled in from the list | `frontend/tests/Enroll.test.js` | `A full section cannot be enrolled in from the list` |
| US-6.3 | Student enrolls in an open section | `backend/tests/enrollments.test.js`, `frontend/tests/Enroll.test.js` | `Student enrolls in an open section` |
| US-6.3 | Enrollment ignores a user id supplied in the request body | `backend/tests/enrollments.test.js` | `Enrollment ignores a user id supplied in the request body` |
| US-6.3 | Student enrolls in a section twice | `backend/tests/enrollments.test.js` | `Student enrolls in a section twice` |
| US-6.3 | Student enrolls in a second section of the same course | `backend/tests/enrollments.test.js` | `Student enrolls in a second section of the same course` |
| US-6.3 | Student enrolls in a full section | `backend/tests/enrollments.test.js` | `Student enrolls in a full section` |
| US-6.3 | Student enrolls without a section id | `backend/tests/enrollments.test.js` | `Student enrolls without a section id` |
| US-6.3 | Student enrolls in a section that does not exist | `backend/tests/enrollments.test.js` | `Student enrolls in a section that does not exist` |
| US-6.3 | Admin cannot enroll | `backend/tests/enrollments.test.js`, `frontend/tests/router.test.js` | `Admin cannot enroll` |
| US-6.3 | Unauthenticated enrollment request is rejected | `backend/tests/enrollments.test.js` | `Unauthenticated enrollment request is rejected` |
| US-6.4 | Student sees only their own enrollments | `backend/tests/enrollments.test.js` | `Student sees only their own enrollments` |
| US-6.4 | Schedule is filtered by the selected semester | `backend/tests/enrollments.test.js` | `Schedule is filtered by the selected semester` |
| US-6.4 | Student has no enrollments in the selected semester | `frontend/tests/Enroll.test.js` | `Student has no enrollments in the selected semester` |
| US-6.4 | Enrollment survives a page reload | `frontend/tests/Enroll.test.js` | `Enrollment survives a page reload` |
| US-6.5 | Student drops a section | `backend/tests/enrollments.test.js`, `frontend/tests/Enroll.test.js` | `Student drops a section` |
| US-6.5 | Dropping frees the seat | `backend/tests/enrollments.test.js` | `Dropping frees the seat` |
| US-6.5 | Student cancels the drop confirmation | `frontend/tests/Enroll.test.js` | `Student cancels the drop confirmation` |
| US-6.6 | Student drops another student's enrollment | `backend/tests/enrollments.test.js` | `Student drops another student's enrollment` |
| US-6.6 | Student drops an enrollment that does not exist | `backend/tests/enrollments.test.js` | `Student drops an enrollment that does not exist` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 6 from @features/feature-6-enrollment-management.md on branch `feature/6-enrollment-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Read semesters and sections through this feature's catalog read APIs. Introduce the minimum `semesters`, `courses`, and `sections` tables plus `GET /courses/semesters` and `GET /courses/sections?semesterId=`. Do not add admin create/update/delete for catalog data.
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-001**–**FR-015** satisfied)
*   [x] **Success Criteria (SC-001**–**SC-005)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete (24 scenarios, 24 matching `it` names)
*   [x] `features/reference/data-model.md` updated
*   [x] `features/reference/api.md` updated
*   [x] `features/reference/behavior.md` updated

---

## Out of Scope

*   Admin create/update/delete UI or HTTP for semesters, courses, or sections (Features 2, 3, 5 reuse the tables this feature adds)
*   Admin views of class rosters
*   Waitlists when a section is full
*   Meeting-time conflict detection between enrolled sections
*   Prerequisites, credit-hour limits, and registration holds
*   Registration open and close dates per semester
*   Grades, transcripts, and faculty assignment
=======
 # Feature: Enrollment Management

  

**Feature ID:** 6

**Branch pattern:** `feature/6-enrollment-management`

**Status:** Ready

**Created:** 2026-10-01

**Input:** Sections selected by the student currently signed in

**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md) [Feature 4 — Section Management](feature-4-section-management.md)

**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

  

---

  

## User Stories

  

### US-5.1: View enrolled sections

**As a** Authorized User  

**I want to** view the list of enrolled sections  

**So that** I can keep track of which sections I am enrolled in

  

**Priority:** P1  

**Independent test:** Display all enrolled sections  

**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

  

### US-5.2 Delete existing section enrollments

**As a** Authorized User  

**I want to** delete any of the existing section enrollments

**So that** I am no longer enrolled in them

  

**Priority:** P1  

**Independent test:** Delete any existing ingredient and clear its data  

**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

  

---

  

## Requirements

  

## Functional Requirements

  

-- **FR-001:** User must be able to enroll in an available section.

-- **FR-002:** enrolled sections must be stored for each user so that they can view and manage them whenever they are signed in.

-- **FR-003:** enrolled sections must be accessible only by the user who created them.

-- **FR-004:** User must not be able to enroll in the same section more than once.

-- **FR-005:** User must be able to drop an existing enrollment.

-- **FR-006:** Enrollment must be completely erased when the option is selected by the user.

-- **FR-007:** enrolled sections must be listed in alphabetical order.

  

---

  

## Assumptions

  

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

- Feature 4 section management MUST be merged to 'dev' before implementing this feature.

  

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.

- **SC-002**: Signed-in user can enroll or drop sections on one screen without being able to access other users' private enrolled sections.

- **SC-003**: `npm test` passes for section API and dashboard sections-view behavior.

  

---

  

## Key Entities

  

-- **Section** named group belonging to one user (from Feature 4).

-- **User** owns many sections (from Feature 1).

  

---

  

## Acceptance Criteria (Gherkin)

  

### US-5.1 — Add a section

  

#### Scenario: User adds a new section

*   **Given** I am signed in on the dashboard

*   **When** I click **+ New Section**

*   **And** I enter section name `Programming I`

*   **And** I enter unit `sticks`

*   **And** I enter price per unit `1.50`

*   **And** I confirm the dialog

*   **Then** the API returns `201` with an ingredient object containing `id`, `name`, `unit`, `pricePerUnit`, and `userId`

*   **And** the returned `userId` matches my authenticated user ID

*   **And** `Butter` appears in the ingredients view

*   **And** the add-ingredient dialog closes

  

#### Scenario: User creates an ingredient with an empty name

*   **Given** I am signed in on the dashboard

*   **When** I open the new ingredient dialog

*   **And** I leave the name field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient name is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an ingredient with an empty unit

*   **Given** I am signed in on the dashboard

*   **When** I open the new ingredient dialog

*   **And** I leave the unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient unit is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an ingredient with an empty price per unit

*   **Given** I am signed in on the dashboard

*   **When** I open the new ingredient dialog

*   **And** I leave the price per unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient price per unit is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an ingredient with a name that is too long

*   **Given** I am signed in on the dashboard

*   **When** I submit an ingredient name longer than 100 characters

*   **Then** the API returns `400` with `{ "message": "Ingredient name must be 100 characters or fewer." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User creates an ingredient with a non-numeric price per unit

*   **Given** I am signed in on the dashboard

*   **When** I submit an ingredient price per unit that is not a number

*   **Then** the API returns `400` with `{ "message": "Ingredient price per unit must be a number." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

---

  

### US-5.2 — Browse the Ingredient Catalogue

  

#### Scenario: User views existing ingredients

*   **Given** I am signed in on the dashboard

*   **When** I open the ingredients menu

*   **Then** ingredients created by me are displayed in alphabetical order

  

#### Scenario: User has no existing ingredients

*   **Given** I am signed in on the dashboard

*   **When** I open the ingredients menu

*   **Then** no ingredients should be displayed

  

### US-5.3 — Correct an ingredient's unit or price

  

#### Scenario: User edits an ingredient's information

*   **Given** I am signed in on the dashboard

*   **When** I click **Edit Ingredient** on an existing ingredient

*   **And** I change any of the original values

*   **And** I confirm the dialog

*   **Then** the API returns `200` with `{ "message": "Ingredient was updated successfully." }`

*   **And** the ingredient is visible with updated information in the ingredients view

*   **And** the edit-ingredient dialog closes

  

#### Scenario: User edits an ingredient with an empty name

*   **Given** I am signed in on the dashboard

*   **When** I open the edit ingredient dialog

*   **And** I leave the name field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient name is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an ingredient with an empty unit

*   **Given** I am signed in on the dashboard

*   **When** I open the edit ingredient dialog

*   **And** I leave the unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient unit is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an ingredient with an empty price per unit

*   **Given** I am signed in on the dashboard

*   **When** I open the edit ingredient dialog

*   **And** I leave the price per unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"Ingredient price per unit is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an ingredient with a name that is too long

*   **Given** I am signed in on the dashboard

*   **When** I submit an ingredient name longer than 100 characters

*   **Then** the API returns `400` with `{ "message": "Ingredient name must be 100 characters or fewer." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits an ingredient with a non-numeric price per unit

*   **Given** I am signed in on the dashboard

*   **When** I submit an ingredient price per unit that is not a number

*   **Then** the API returns `400` with `{ "message": "Ingredient price per unit must be a number." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

### US-5.4 Remove an ingredient

  

#### Scenario: User removes an ingredient

*   **Given** I am signed in

*   **And** I own an ingredient named `Butter`

*   **When** I click the delete icon on the `Butter` row

*   **And** I confirm the delete dialog

*   **Then** the API returns `200` or `204`

*   **And** the ingredient is removed from the ingredients view

  

---

  

## Data Model Requirements

  

### `ingredients` table

| Field | Type | Rules |

|-------|------|-------|

| `id` | INTEGER | PK, auto-increment |

| `userId` | INTEGER | Required, FK → `users.id`, `ON DELETE CASCADE` |

| `name` | STRING(100) | Required; unique per (`userId`, `name`); stored and displayed as typed |

| `unit` | STRING(100) | Required; stored and displayed as typed |

| `pricePerUnit` | DECIMAL(10, 2) | Required; numeric |

| `createdAt` | DATE | Sequelize timestamp |

| `updatedAt` | DATE | Sequelize timestamp |

  

### Associations

  

| Association | Rule |

|-------------|------|

| `User` hasMany `Ingredient` | `foreignKey` `userId` required; `ON DELETE CASCADE` |

| `Ingredient` belongsTo `User` | `userId` set from `req.user.id` on create — never from the client body |

| Unique | Composite unique (`userId`, `name`) as specified in the table above |

  

JSON property names match these columns (`name`, `unit`, `pricePerUnit`, `userId`). Sequelize may also return `createdAt` / `updatedAt`; Gherkin does not require the client to display them.

  

Existing `recipeIngredient` rows may reference `ingredients.id`. This feature does not add, edit, or display recipe–ingredient links.

  

---

  

## Data Ownership & Isolation

  

Each user owns their catalogue `ingredients` exclusively. List, create, update, and delete are scoped to the signed-in user (Feature 1 session). Feature 4 owns the catalogue entity; this feature enforces the same owner isolation on the shared `/recipeapi/ingredients` resource.

  

| Rule | Requirement |

|------|-------------|

| **Read scope** | `GET /recipeapi/ingredients` returns only rows where `userId = req.user.id`, ordered by `name` ASC (**FR-007**) |

| **Write scope** | `PUT` / `DELETE /recipeapi/ingredients/:id` succeed only when the row matches `id` **and** `userId = req.user.id` |

| **Create scope** | `POST /recipeapi/ingredients` sets `userId` from `req.user.id`; ignore any client-supplied `userId` |

| **Cross-user access** | Another user’s ingredient (or unknown `id`) → `404` with `{ "message": "…" }` (not `403`) |

| **UI scope** | `IngredientList.vue` renders only the array returned for the signed-in user; do not mix in other users’ rows |

| **Implementation** | Shared owner lookup in `backend/app/authorization/` (for example `getAccessibleIngredientOrNull`); do not copy `userId` filters by hand in every controller action |

  

Unauthenticated requests to these endpoints → `401`.

  

---

  

## API Requirements

  

Mount prefix is `/recipeapi` (existing `ingredient.routes.js`). Paths and JSON fields match the running Recipe app (`name`, `unit`, `pricePerUnit`). Auth is **Yes** on every row this feature uses (**FR-003**). Do not add query filters, extra fields, or a `{ success, data }` envelope.

  

| Method | Endpoint | Auth | Purpose |

|--------|----------|------|---------|

| `GET` | `/recipeapi/ingredients` | Yes | List the caller’s ingredients, `name` ASC |

| `POST` | `/recipeapi/ingredients` | Yes | Create an ingredient owned by the caller |

| `PUT` | `/recipeapi/ingredients/:id` | Yes | Update an owned ingredient |

| `DELETE` | `/recipeapi/ingredients/:id` | Yes | Delete an owned ingredient |

  

Trailing slashes already present on some Express routes are equivalent to the paths above.

  

**Create request body:**

```json

{

  "name": "Butter",

  "unit": "sticks",

  "pricePerUnit": 1.5

}

```

  

**Create success** (`201`):

```json

{

  "id": 1,

  "name": "Butter",

  "unit": "sticks",

  "pricePerUnit": 1.5,

  "userId": 42

}

```

  

`name` and `unit` are stored and returned as typed. `pricePerUnit` is numeric (`DECIMAL(10, 2)`).

  

**Update request body:** same three fields (`name`, `unit`, `pricePerUnit`).

  

**Update success** (`200`):

```json

{ "message": "Ingredient was updated successfully." }

```

  

**Delete success:** `200` or `204` (Gherkin allows either). A `200` body may include a message; clients must treat either status as success.

  

**List success** (`200`): JSON array of ingredient objects (same fields as create). Empty catalogue → `[]`.

  

**Inline-blocked create/edit** (empty or whitespace-only name, unit, or price per unit): the UI does not send a request. If the API is called anyway, respond `400`.

  

**Quoted validation errors** (`400`): `{ "message": "…" }` with the Gherkin strings:

  

| Condition | `message` |

|-----------|-----------|

| Name longer than 100 characters | `Ingredient name must be 100 characters or fewer.` |

| `pricePerUnit` is not a number | `Ingredient price per unit must be a number.` |

  

**Other errors:** `{ "message": "Human-readable explanation." }`  

**Not found / not owned:** `404` (do not use `403`).  

**Invalid `ingredientId`:** `400` (Edge Cases).  

**Unauthenticated:** `401`.

  

`GET /recipeapi/ingredients/:id` and `DELETE /recipeapi/ingredients` (delete-all) exist in the starter routes; this feature does not specify or test them.

  

---

  

## Screen Requirements

  

### [View: Ingredients] — route name `ingredients` (`/ingredients`)

  

Existing view: `frontend/src/views/IngredientList.vue`. Client calls: `frontend/src/services/IngredientServices.js` (`GET`/`POST`/`PUT`/`DELETE` `ingredients`). Align labels and validation with Gherkin; keep this route, view, and service.

  

*   Heading: **Ingredients**

*   Purpose: signed-in user creates, lists (A–Z), edits, and deletes their catalogue ingredients on this one screen (**SC-002**)

*   Primary action: **+ New Ingredient** (`oc-cta`) — opens the add dialog (US-5.1)

*   Table columns: **Name**, **Unit**, **Price Per Unit**, plus row actions

*   Rows show `name`, `unit`, and `pricePerUnit` as stored (unit is a text field, not a fixed unit list)

*   Row action **Edit Ingredient** — opens the edit dialog with that row’s values (US-5.3)

*   Row action: delete icon — opens a confirm-delete dialog (US-5.4). Icon-only control needs an accessible name (for example `aria-label="Delete ingredient"`)

*   **Empty state:** no ingredient rows (US-5.2 “User has no existing ingredients”)

*   **Loading:** in-progress list request (`:loading` or equivalent); do not treat loading as an empty catalogue

*   **Error:** API failures and quoted `400` messages in `<v-alert type="error">` (Gherkin)

  

**Add dialog**

*   Opened by **+ New Ingredient**

*   Fields: name, unit, price per unit (all required — **FR-001**)

*   Confirm creates via `POST`; on `201` the dialog closes and `Butter` (or the typed name) appears in the table

*   Cancel / dismiss closes without a request

  

**Edit dialog**

*   Opened by **Edit Ingredient**

*   Same three fields, prefilled (**FR-004**)

*   Confirm updates via `PUT`; on `200` the dialog closes and the table shows the new values (**FR-005**)

  

**Delete dialog**

*   Opened from the row delete icon

*   Confirm calls `DELETE`; on `200` or `204` the row is gone (**FR-006**)

  

**Inline validation** (no API request) — exact copy from Gherkin:

  

| Field empty or whitespace | Message |

|---------------------------|---------|

| Name | `Ingredient name is required.` |

| Unit | `Ingredient unit is required.` |

| Price per unit | `Ingredient price per unit is required.` |

  

**App chrome**

*   `MenuBar` already has **Ingredients** (`:to="{ name: 'ingredients' }"`) when a user is signed in — keep it. Gherkin “open the ingredients menu” is this control.

*   This feature does not add or change Login / Recipes / profile chrome.

  

---

  

## Test Coverage Map

  

Each scenario above must map to at least one automated test. Story IDs follow the Gherkin headings in this file (`### US-5.n`). `it("…")` titles must match the **Scenario** column exactly.

  

If Feature 4 already added the same scenario titles in these files, extend those files — do not duplicate `it` names.

  

| Story | Scenario | Test file | Test name |

|-------|----------|-----------|-----------|

| US-5.1 | User creates a new ingredient | `backend/tests/ingredients.test.js` | `User creates a new ingredient` |

| US-5.1 | User creates a new ingredient | `frontend/tests/IngredientList.test.js` | `User creates a new ingredient` |

| US-5.1 | User creates an ingredient with an empty name | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with an empty name` |

| US-5.1 | User creates an ingredient with an empty unit | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with an empty unit` |

| US-5.1 | User creates an ingredient with an empty price per unit | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with an empty price per unit` |

| US-5.1 | User creates an ingredient with a name that is too long | `backend/tests/ingredients.test.js` | `User creates an ingredient with a name that is too long` |

| US-5.1 | User creates an ingredient with a name that is too long | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with a name that is too long` |

| US-5.1 | User creates an ingredient with a non-numeric price per unit | `backend/tests/ingredients.test.js` | `User creates an ingredient with a non-numeric price per unit` |

| US-5.1 | User creates an ingredient with a non-numeric price per unit | `frontend/tests/IngredientList.test.js` | `User creates an ingredient with a non-numeric price per unit` |

| US-5.2 | User views existing ingredients | `backend/tests/ingredients.test.js` | `User views existing ingredients` |

| US-5.2 | User views existing ingredients | `frontend/tests/IngredientList.test.js` | `User views existing ingredients` |

| US-5.2 | User has no existing ingredients | `backend/tests/ingredients.test.js` | `User has no existing ingredients` |

| US-5.2 | User has no existing ingredients | `frontend/tests/IngredientList.test.js` | `User has no existing ingredients` |

| US-5.3 | User edits an ingredient's information | `backend/tests/ingredients.test.js` | `User edits an ingredient's information` |

| US-5.3 | User edits an ingredient's information | `frontend/tests/IngredientList.test.js` | `User edits an ingredient's information` |

| US-5.3 | User edits an ingredient with an empty name | `frontend/tests/IngredientList.test.js` | `User edits an ingredient with an empty name` |

| US-5.3 | User edits an ingredient with an empty unit | `frontend/tests/IngredientList.test.js` | `User edits an ingredient with an empty unit` |

| US-5.3 | User edits an ingredient with an empty price per unit | `frontend/tests/IngredientList.test.js` | `User edits an ingredient with an empty price per unit` |

| US-5.3 | User edits an ingredient with a name that is too long | `backend/tests/ingredients.test.js` | `User edits an ingredient with a name that is too long` |

| US-5.3 | User edits an ingredient with a name that is too long | `frontend/tests/IngredientList.test.js` | `User edits an ingredient with a name that is too long` |

| US-5.3 | User edits an ingredient with a non-numeric price per unit | `backend/tests/ingredients.test.js` | `User edits an ingredient with a non-numeric price per unit` |

| US-5.3 | User edits an ingredient with a non-numeric price per unit | `frontend/tests/IngredientList.test.js` | `User edits an ingredient with a non-numeric price per unit` |

| US-5.4 | User removes an ingredient | `backend/tests/ingredients.test.js` | `User removes an ingredient` |

| US-5.4 | User removes an ingredient | `frontend/tests/IngredientList.test.js` | `User removes an ingredient` |

  

---

  

## Agent implementation request

  

Copy when asking Cursor to implement this feature (`@` this file):

  

```text

Implement Feature 5 from @features/feature-5-ingredients-management.md on branch `feature/5-ingredients-management`.

  

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).

Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.

If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.

Complete Definition of Done and the merge checklist in @features/framework.md.

Do not implement behavior not in this spec.

```

  

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md` (owner-scoped `/recipeapi/ingredients`, `ingredients.userId`, list/edit/delete rules).

  

---

  

## Definition of Done

  

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-007** satisfied)

*   [ ] **Success Criteria (SC-001**–**SC-003)** met

*   [ ] All mapped tests pass (`npm test`)

*   [ ] Test Coverage Map complete

*   [ ] `features/reference/data-model.md` updated (if schema changed)

*   [ ] `features/reference/api.md` updated (if API changed)

*   [ ] `features/reference/behavior.md` updated (if product rules changed)

  

---

  

## Out of Scope

  

*   Sign-in, registration, and session issuance ([Feature 1](./feature-1-user-authentification.md))

*   Defining the ingredient catalogue entity if Feature 4 already shipped it ([Feature 4](./feature-4-ingredient-catalogue-management.md)) — this feature consumes that entity on the existing Ingredients screen. Create/browse/edit/delete Gherkin titles are shared with Feature 4; keep one `it()` per title in `ingredients.test.js` / `IngredientList.test.js`.

*   Attaching ingredients to recipes, recipe steps, or `recipeIngredient` quantity/unit on a recipe ([later recipe features](./feature-list.md))

*   `GET /recipeapi/ingredients/:id` and `DELETE /recipeapi/ingredients` (delete-all) — starter routes; not in this feature’s Gherkin

*   Profile / log out ([Feature 6](./feature-list.md))

*   Recipe PDF export, published-recipe browsing, and any other capability not in **FR-001**–**FR-007**

*   Multi-user sharing of a catalogue, admin override, or i18n
>>>>>>> 11bf607 (Progress on feature 6 md)

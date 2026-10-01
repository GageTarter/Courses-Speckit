# Feature: Section Enrollment

**Feature ID:** 6
**Branch pattern:** `feature/6-enrollment-management`
**Status:** Draft
**Created:** 2026-10-01
**Input:** A signed-in student picks a semester, browses the sections offered in it, and enrolls in the ones they want; they can review and drop their own enrollments
**Depends on:** [Feature 1 — User Authentication & Role-Based Access](./feature-1-user-auth.md), [Feature 2 — Course Management](./feature-2-course-management.md), [Feature 3 — Semester Management](./feature-3-semester-management.md), [Feature 5 — Section Management](./feature-5-section-management.md)
**Related:** [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md), `features/reference/api.md`

---

## Contract dependencies

This feature **consumes** read endpoints owned by other features and **introduces** only the enrollment endpoints. The shapes below are the minimum this feature needs; confirm them against the owning specs before setting `Status: Ready`.

| Endpoint | Owner | This feature needs |
|----------|-------|--------------------|
| `GET /courses/semesters` | Feature 3 | `id`, `name` for the semester selector |
| `GET /courses/sections?semesterId=N` | Feature 5 | `id`, `sectionNumber`, `capacity`, `semesterId`, and the parent course's `code` and `title` |

- **[NEEDS CLARIFICATION: does Feature 5 expose sections filtered by `?semesterId=`, or only nested under `/courses/semesters/:id/sections`?]**
- **[NEEDS CLARIFICATION: does the Feature 5 section payload embed the course object, or only `courseId`? If only the id, this feature needs a second request or an `include`.]**

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

- Features 1, 2, 3, and 5 are merged to `dev` before this feature is implemented; their models, seed data, and read endpoints exist.
- Semesters, courses, and sections are maintained by admins; this feature never creates or edits them.
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
| **Catalog data** | Semesters, courses, and sections are readable by any authenticated user; this feature never writes them |
| **UI scope** | The schedule panel renders only what `GET /courses/enrollments` returned for the signed-in student |
| **Implementation** | Ownership lookup lives in a shared helper in `backend/app/authorization/` — controllers must not duplicate the scope clause |

---

## API Requirements

Endpoints introduced by this feature:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/enrollments` | Yes | List the signed-in student's enrollments; optional `?semesterId=N` filter |
| `POST` | `/courses/enrollments` | Yes | Enroll the signed-in student in a section |
| `DELETE` | `/courses/enrollments/:id` | Yes | Drop one of the signed-in student's enrollments |

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
- **Section** (read-only here): a scheduled offering of a course within a semester, with a seat capacity. Owned by Feature 5.
- **Semester** (read-only here): the term a section belongs to. Owned by Feature 3.
- **Course** (read-only here): the catalog entry a section offers. Owned by Feature 2.

---

## Data Model Requirements

This feature introduces one table and adds no columns to existing ones.

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
*   `Section hasMany Enrollment`
*   `Enrollment belongsTo Section`

Associations are wired in `backend/app/models/index.js`. The `Section belongsTo Course` and `Section belongsTo Semester` associations are owned by Feature 5; this feature reads through them via `include` and does not redefine them.

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
| US-6.3 | Admin cannot enroll | `backend/tests/enrollments.test.js` | `Admin cannot enroll` |
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
Read semesters and sections through the endpoints owned by Features 3 and 5 — do not create or modify semester, course, or section models.
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)
*   [ ] Both `[NEEDS CLARIFICATION]` items in **Contract dependencies** resolved against Features 3 and 5

---

## Out of Scope

*   Creating or editing semesters ([Feature 3](./feature-3-semester-management.md)), courses ([Feature 2](./feature-2-course-management.md)), or sections ([Feature 5](./feature-5-section-management.md))
*   Admin views of class rosters
*   Waitlists when a section is full
*   Meeting-time conflict detection between enrolled sections
*   Prerequisites, credit-hour limits, and registration holds
*   Registration open and close dates per semester
*   Grades, transcripts, and faculty assignment

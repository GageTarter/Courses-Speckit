# Feature: Student Section Listing

**Feature ID:** 8
**Branch pattern:** `feature/8-student-section-listing`
**Status:** Ready
**Created:** 2026-10-21
**Input:** A signed-in student sees the catalogue sections they are currently enrolled in
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Course Management](feature-2-course-management.md), [Feature 3 — Semester Management](feature-3-semester-management.md), [Feature 5 — Section Management](feature-5-section-management.md), [Feature 6 — Enrollment Management](feature-6-enrollment-management.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-8.1: Browse my enrolled sections
**As a** signed-in student
**I want to** see each section I am enrolled in, with its section number, a semester from Feature 3, a course ID, a faculty ID, days of the week, and a start time and end time
**So that** I can review the sections I am in without opening the enrollment schedule
**Priority:** P1
**Independent test:** Sign in as a student who is enrolled in two sections and confirm My Sections lists those sections in section `id` order
**Acceptance scenarios:** see ### US-8.1 under Acceptance Criteria

---

## Requirements

## Functional Requirements

- **FR-001:** A signed-in student sees only catalogue sections reached through their own enrollment rows (`enrollment.userId` equals the session user). A section with no enrollment for that student is omitted. Another student's enrollments are omitted.
- **FR-002:** The list is ordered by section `id` ascending.
- **FR-003:** Each section appears once. Two enrollments in different sections of the same course produce two rows.
- **FR-004:** A section stays listed while the student still has an enrollment in that section. After that enrollment is dropped, the section disappears.
- **FR-005:** `GET /courses/my-sections` requires a signed-in student. No token → `401`. A signed-in admin → `403` with `{ "message": "Forbidden! Student access required." }`.
- **FR-006:** This feature does not create, update, or delete courses, sections, semesters, or enrollments, and it does not change `GET /courses/sections`.

---

## Assumptions

- Features 1, 2, 3, 5, and 6 are merged to `dev` before this feature is implemented.
- "Enrolled" means an existing row in `enrollments` for the signed-in student. Feature 6 owns creating and dropping those rows.
- **Semester** on this list is the Feature 3 semester name (`semesters.name`, for example `Fall 2026`) from the section's `semesterId`. It is not the catalogue field `semesterOffered` (`Fall`, `Spring`, `Summer`, `Winter`).
- **Course ID** is the catalogue code `courses.courseID` (for example `CMSC-1113-01`), not the numeric `sections.courseId`.
- **Faculty ID** is the numeric `sections.facultyId`. This list does not show the faculty member's name.
- `sections.userId` is the admin who created the section (Feature 5). It is not the enrolled student.

## Edge Cases

- The student has no enrollments → `200` with `[]`, and the page shows **"You are not enrolled in any sections."**
- The student is enrolled in two sections of the same course → two rows.
- A catalogue section exists but this student is not enrolled → that section is absent.
- Missing or invalid token → `401`.
- Signed-in admin calls `GET /courses/my-sections` → `403`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in student can see only their enrolled sections on **My Sections**.
- **SC-003**: `npm test` passes, including `backend/tests/mySections.test.js` and `frontend/tests/MySections.test.js`.

## Data Ownership & Isolation

Sections stay a shared catalogue. `sections.userId` remains the creating admin. This screen's rows are the sections linked to the signed-in student's enrollments (**FR-001**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /courses/my-sections` returns one row per section for enrollments where `userId = req.user.id`, ordered by section `id` ascending (**FR-002**, **FR-003**) |
| **Role** | Student only. Admin → `403`. Unauthenticated → `401` (**FR-005**) |
| **UI scope** | `MySections.vue` renders only the array from `GET /courses/my-sections`. It has no create, edit, or delete controls |
| **Catalogue** | Do not filter or replace `GET /courses/sections`. That list stays the admin catalogue from Feature 5 |

## Key Entities

- **Section** — shared catalogue offering (Feature 5). Display `sectionNumber`, the Feature 3 semester name, `courseID`, `facultyId`, `daysOfWeek`, `startTime`, and `endTime`.
- **Enrollment** — the signed-in student's link to a section (Feature 6). This feature only reads it.
- **Semester** — Feature 3 row named by `sections.semesterId`. This feature only reads `name`.
- **Course** — Feature 2 row named by `sections.courseId`. This feature only reads `courseID`.

## API Requirements

Mount prefix is `/courses`. This feature adds one read endpoint. It does not change Feature 5 section CRUD or Feature 6 enroll/drop.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/my-sections` | Yes (student) | Sections the caller is enrolled in, section `id` ascending (**FR-001**, **FR-002**, **FR-003**, US-8.1) |

**List success** (`200`):

```json
[
  {
    "id": 5,
    "sectionNumber": 1,
    "semester": "Fall 2026",
    "courseID": "CMSC-1113-01",
    "facultyId": 3,
    "daysOfWeek": "Monday,Wednesday",
    "startTime": "11:40",
    "endTime": "12:50"
  }
]
```

`id` is the section id. `sectionNumber` is the integer stored on the section (1 through 99). `semester` is `semesters.name`. `courseID` is `courses.courseID`. `facultyId` is `sections.facultyId`. `daysOfWeek` is the stored comma-separated string. `startTime` and `endTime` are `HH:MM` strings. Do not add `userId`, `courseId`, `semesterId`, `semesterOffered`, faculty name, capacity, or a `{ success, data }` envelope.

**Errors:** `{ "message": "…" }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| No token or invalid token | `401` | Existing unauthorized message from Feature 1 |
| Signed-in user is not a student | `403` | `Forbidden! Student access required.` |

Empty enrollment set → `200` and `[]`, not an error.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Errors use `<v-alert type="error">`.

### [View: My Sections] — route name `my-sections`

*   **Route:** `/my-sections` → `frontend/src/views/MySections.vue`. Students only. An admin who opens this route is sent home. A signed-out visitor is sent to login.
*   **Heading:** **My Sections**
*   **Purpose:** One screen where the signed-in student reviews catalogue sections they are enrolled in. This is not the admin Sections page, not **My Courses**, and not the Enroll schedule.
*   **Columns:** Section number, Semester, Course ID, Faculty ID, Days, Start time, End time. Section number displays as two digits (`1` shows as `01`). No Actions column. No add, edit, or delete controls.
*   **Empty state:** **"You are not enrolled in any sections."**
*   **Loading:** a loading indicator while the list request is in flight.
*   **Error:** a failed load shows the API `message` in `<v-alert type="error">`.

**App chrome**

*   Add a **My Sections** item on `MenuBar`, visible only when the signed-in user is a student (`:to="{ name: 'my-sections' }"`).
*   Leave the student **My Courses** item and the admin **Sections** item unchanged.
*   MenuBar stays hidden on login and register (Feature 1).

## Data Model Requirements

No new tables and no new columns. Read existing rows:

| From | Use |
|------|-----|
| `enrollments` | Keep rows whose `userId` is the signed-in student |
| `sections` | One list row per enrolled section: `id`, `sectionNumber`, `facultyId`, `daysOfWeek`, `startTime`, `endTime` |
| `semesters` | `name` for the section's `semesterId`, returned as `semester` |
| `courses` | `courseID` for the section's `courseId` |

Do not add a student `userId` to `sections`. Do not treat `sections.userId` as the enrolled student.

## Acceptance Criteria (Gherkin)

### US-8.1 — Browse my enrolled sections

#### Scenario: Student sees enrolled sections in id order
*   **Given** I am signed in as a student
*   **And** I am enrolled in section **02** of **Software Engineering IV** (`CMSC 4123`), created first
*   **And** I am enrolled in section **01** of **Programming I** (`CMSC-1113-01`) for semester **Fall 2026**, with faculty id **3**, days **Monday,Wednesday**, start **11:40**, and end **12:50**, created second
*   **When** I open **My Sections**
*   **Then** the API returns `200` with the Software Engineering IV section first, then the Programming I section
*   **And** the Programming I row shows section number `1`, semester **Fall 2026**, course ID **CMSC-1113-01**, faculty ID `3`, days **Monday,Wednesday**, start **11:40**, and end **12:50**

#### Scenario: A section the student is not enrolled in is hidden
*   **Given** I am signed in as a student enrolled only in section **01** of **Programming I**
*   **And** the catalogue also contains a section of **Data Structures**
*   **When** I open **My Sections**
*   **Then** the Programming I section is listed
*   **And** the Data Structures section is not listed

#### Scenario: Student sees only their own enrolled sections
*   **Given** student A is enrolled in section **01** of **Programming I**
*   **And** student B is enrolled in a section of **Data Structures**
*   **When** student A opens **My Sections**
*   **Then** the Programming I section is listed
*   **And** the Data Structures section is not listed

#### Scenario: Two sections of the same course both appear
*   **Given** I am signed in as a student
*   **And** I am enrolled in section **01** and section **02** of **Programming I**
*   **When** I open **My Sections**
*   **Then** both sections are listed

#### Scenario: Student has no enrollments
*   **Given** I am signed in as a student
*   **And** I have no enrollments
*   **When** I open **My Sections**
*   **Then** the API returns `200` with `[]`
*   **And** I see **"You are not enrolled in any sections."**

#### Scenario: Dropping a section removes it
*   **Given** I am signed in as a student enrolled in section **01** of **Programming I**
*   **And** that section is listed on **My Sections**
*   **When** that enrollment is dropped
*   **And** I open **My Sections** again
*   **Then** that section is not listed

#### Scenario: Unauthenticated request is rejected
*   **Given** I am not signed in
*   **When** I request `GET /courses/my-sections`
*   **Then** the API returns `401`

#### Scenario: Admin cannot list enrolled sections
*   **Given** I am signed in as an admin
*   **When** I request `GET /courses/my-sections`
*   **Then** the API returns `403` with `{ "message": "Forbidden! Student access required." }`

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` titles match the **Scenario** column. Do not add these titles to `sections.test.js`, `SectionList.test.js`, `enrollments.test.js`, or `Enroll.test.js`.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-8.1 | Student sees enrolled sections in id order | `backend/tests/mySections.test.js` | `Student sees enrolled sections in id order` |
| US-8.1 | Student sees enrolled sections in id order | `frontend/tests/MySections.test.js` | `Student sees enrolled sections in id order` |
| US-8.1 | A section the student is not enrolled in is hidden | `backend/tests/mySections.test.js` | `A section the student is not enrolled in is hidden` |
| US-8.1 | A section the student is not enrolled in is hidden | `frontend/tests/MySections.test.js` | `A section the student is not enrolled in is hidden` |
| US-8.1 | Student sees only their own enrolled sections | `backend/tests/mySections.test.js` | `Student sees only their own enrolled sections` |
| US-8.1 | Two sections of the same course both appear | `backend/tests/mySections.test.js` | `Two sections of the same course both appear` |
| US-8.1 | Student has no enrollments | `frontend/tests/MySections.test.js` | `Student has no enrollments` |
| US-8.1 | Dropping a section removes it | `backend/tests/mySections.test.js` | `Dropping a section removes it` |
| US-8.1 | Unauthenticated request is rejected | `backend/tests/mySections.test.js` | `Unauthenticated request is rejected` |
| US-8.1 | Admin cannot list enrolled sections | `backend/tests/mySections.test.js` | `Admin cannot list enrolled sections` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 8 from @features/feature-8-student-section-listing.md on branch `feature/8-student-section-listing`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/behavior.md`. No schema change, so `features/reference/data-model.md` stays as-is unless a query-only note is useful.

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/api.md` updated
*   [x] `features/reference/behavior.md` updated

## Out of Scope

*   Register, sign in, session persistence, and logout ([Feature 1](feature-1-user-auth.md))
*   Admin section create, edit, delete, and the `/sections` catalogue page ([Feature 5](feature-5-section-management.md))
*   Enrolling, dropping, seat counts, and the per-semester schedule ([Feature 6](feature-6-enrollment-management.md))
*   The enrolled-courses list ([Feature 7](feature-7-student-course-listing.md))
*   Course name, description, or `semesterOffered` on this list
*   Faculty first name, last name, or department on this list
*   Returning `sections.userId`, capacity, or remaining seats
*   Adding a student `userId` to `sections`
*   Profile management

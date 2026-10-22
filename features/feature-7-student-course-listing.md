# Feature: Student Course Listing

**Feature ID:** 7
**Branch pattern:** `feature/7-student-course-listing`
**Status:** Ready
**Created:** 2026-9-24
**Input:** A signed-in student sees the catalogue courses they are currently enrolled in
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Course Management](feature-2-course-management.md), [Feature 5 — Section Management](feature-5-section-management.md), [Feature 6 — Enrollment Management](feature-6-enrollment-management.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-7.1: Browse my enrolled courses
**As a** signed-in student
**I want to** see each course I am enrolled in, with its name, course ID, description, and semester offered
**So that** I can review the courses I am taking without opening the enrollment schedule
**Priority:** P1
**Independent test:** Sign in as a student who is enrolled in two courses and confirm My Courses lists those courses in alphabetical order
**Acceptance scenarios:** see ### US-7.1 under Acceptance Criteria

---

## Requirements

## Functional Requirements

- **FR-001:** A signed-in student sees only catalogue courses reached through their own enrollment rows (`enrollment.userId` equals the session user). A course with no enrollment for that student is omitted. Another student's enrollments are omitted.
- **FR-002:** The list is ordered by course `name` ascending.
- **FR-003:** Each course appears once. Two enrollments in different sections or semesters of the same course produce one row.
- **FR-004:** A course stays listed while the student still has at least one enrollment in a section of that course. After the last such enrollment is dropped, the course disappears.
- **FR-005:** `GET /courses/my-courses` requires a signed-in student. No token → `401`. A signed-in admin → `403` with `{ "message": "Forbidden! Student access required." }`.
- **FR-006:** This feature does not create, update, or delete courses, sections, or enrollments, and it does not change `GET /courses/courses`.

---

## Assumptions

- Features 1, 2, 5, and 6 are merged to `dev` before this feature is implemented.
- "Enrolled" means an existing row in `enrollments` for the signed-in student. Feature 6 owns creating and dropping those rows.
- **Semester offered** is the catalogue field `semesterOffered` (`Fall`, `Spring`, `Summer`, `Winter`, or blank). It is not the Feature 3 semester name on the section (for example `Fall 2026`). Feature 6's Enroll page remains the per-semester section schedule.

## Edge Cases

- The student has no enrollments → `200` with `[]`, and the page shows **"You are not enrolled in any courses."**
- `description` or `semesterOffered` is `null` → that cell is blank.
- The same course is enrolled in two sections or two semesters → one row.
- A catalogue course exists but this student is not enrolled → that course is absent.
- Missing or invalid token → `401`.
- Signed-in admin calls `GET /courses/my-courses` → `403`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in student can see only their enrolled courses on **My Courses**.
- **SC-003**: `npm test` passes, including `backend/tests/myCourses.test.js` and `frontend/tests/MyCourses.test.js`.

## Data Ownership & Isolation

Courses stay a shared catalogue with no `userId`. This screen's rows are the courses linked to the signed-in student's enrollments (**FR-001**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /courses/my-courses` returns distinct courses for enrollments where `userId = req.user.id`, ordered by `name` ascending (**FR-002**, **FR-003**) |
| **Role** | Student only. Admin → `403`. Unauthenticated → `401` (**FR-005**) |
| **UI scope** | `MyCourses.vue` renders only the array from `GET /courses/my-courses`. It has no create, edit, or delete controls |
| **Catalogue** | Do not filter or replace `GET /courses/courses`. That list stays the admin catalogue from Feature 2 |

## Key Entities

- **Course** — shared catalogue entry (Feature 2). Display `name`, `courseID`, `description`, and `semesterOffered`.
- **Enrollment** — the signed-in student's link to a section (Feature 6). This feature only reads it.
- **Section** — joins an enrollment to a course (Feature 5). This feature only reads it.

## API Requirements

Mount prefix is `/courses`. This feature adds one read endpoint. It does not change Feature 2 course CRUD or Feature 6 enroll/drop.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/my-courses` | Yes (student) | Distinct courses the caller is enrolled in, `name` ascending (**FR-001**, **FR-002**, **FR-003**, US-7.1) |

**List success** (`200`):

```json
[
  {
    "id": 5,
    "name": "Programming I",
    "courseID": "CMSC-1113-01",
    "description": "Introduction to programming",
    "semesterOffered": "Fall"
  }
]
```

`description` and `semesterOffered` are `null` when the catalogue left them blank. Do not add `userId`, section fields, or a `{ success, data }` envelope.

**Errors:** `{ "message": "…" }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| No token or invalid token | `401` | Existing unauthorized message from Feature 1 |
| Signed-in user is not a student | `403` | `Forbidden! Student access required.` |

Empty enrollment set → `200` and `[]`, not an error.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Errors use `<v-alert type="error">`.

### [View: My Courses] — route name `my-courses`

*   **Route:** `/my-courses` → `frontend/src/views/MyCourses.vue`. Students only. An admin who opens this route is sent home. A signed-out visitor is sent to login.
*   **Heading:** **My Courses**
*   **Purpose:** One screen where the signed-in student reviews catalogue courses they are enrolled in. This is not the admin Courses page and not the Enroll schedule.
*   **Columns:** Name, Course ID, Description, Semester offered. No Actions column. No add, edit, or delete controls.
*   **Empty state:** **"You are not enrolled in any courses."**
*   **Loading:** a loading indicator while the list request is in flight.
*   **Error:** a failed load shows the API `message` in `<v-alert type="error">`.

**App chrome**

*   Add a **My Courses** item on `MenuBar`, visible only when the signed-in user is a student (`:to="{ name: 'my-courses' }"`).
*   Leave the admin **Courses** item on `/courses` unchanged (Feature 2).
*   MenuBar stays hidden on login and register (Feature 1).

## Data Model Requirements

No new tables and no new columns. Read existing rows:

| From | Use |
|------|-----|
| `enrollments` | Keep rows whose `userId` is the signed-in student |
| `sections` | Resolve `courseId` from each enrollment's section |
| `courses` | Return distinct courses for those ids |

Do not add `userId` to `courses`.

## Acceptance Criteria (Gherkin)

### US-7.1 — Browse my enrolled courses

#### Scenario: Student sees enrolled courses in alphabetical order
*   **Given** I am signed in as a student
*   **And** I am enrolled in **Software Engineering IV** (`CMSC 4123`) and **Programming I** (`CMSC-1113-01`)
*   **When** I open **My Courses**
*   **Then** the API returns `200` with those courses ordered by name: **Programming I**, then **Software Engineering IV**
*   **And** each row shows that course's name, course ID, description, and semester offered

#### Scenario: A course the student is not enrolled in is hidden
*   **Given** I am signed in as a student enrolled only in **Programming I**
*   **And** the catalogue also contains **Data Structures**
*   **When** I open **My Courses**
*   **Then** **Programming I** is listed
*   **And** **Data Structures** is not listed

#### Scenario: Student sees only their own enrolled courses
*   **Given** student A is enrolled in **Programming I**
*   **And** student B is enrolled in **Data Structures**
*   **When** student A opens **My Courses**
*   **Then** **Programming I** is listed
*   **And** **Data Structures** is not listed

#### Scenario: The same course enrolled twice appears once
*   **Given** I am signed in as a student
*   **And** I am enrolled in two sections of **Programming I**
*   **When** I open **My Courses**
*   **Then** **Programming I** appears once

#### Scenario: Student has no enrollments
*   **Given** I am signed in as a student
*   **And** I have no enrollments
*   **When** I open **My Courses**
*   **Then** the API returns `200` with `[]`
*   **And** I see **"You are not enrolled in any courses."**

#### Scenario: Dropping the last section removes the course
*   **Given** I am signed in as a student enrolled in one section of **Programming I**
*   **And** **Programming I** is listed on **My Courses**
*   **When** that enrollment is dropped
*   **And** I open **My Courses** again
*   **Then** **Programming I** is not listed

#### Scenario: Unauthenticated request is rejected
*   **Given** I am not signed in
*   **When** I request `GET /courses/my-courses`
*   **Then** the API returns `401`

#### Scenario: Admin cannot list enrolled courses
*   **Given** I am signed in as an admin
*   **When** I request `GET /courses/my-courses`
*   **Then** the API returns `403` with `{ "message": "Forbidden! Student access required." }`

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` titles match the **Scenario** column. Do not add these titles to `courses.test.js` or `CourseList.test.js`.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-7.1 | Student sees enrolled courses in alphabetical order | `backend/tests/myCourses.test.js` | `Student sees enrolled courses in alphabetical order` |
| US-7.1 | Student sees enrolled courses in alphabetical order | `frontend/tests/MyCourses.test.js` | `Student sees enrolled courses in alphabetical order` |
| US-7.1 | A course the student is not enrolled in is hidden | `backend/tests/myCourses.test.js` | `A course the student is not enrolled in is hidden` |
| US-7.1 | A course the student is not enrolled in is hidden | `frontend/tests/MyCourses.test.js` | `A course the student is not enrolled in is hidden` |
| US-7.1 | Student sees only their own enrolled courses | `backend/tests/myCourses.test.js` | `Student sees only their own enrolled courses` |
| US-7.1 | The same course enrolled twice appears once | `backend/tests/myCourses.test.js` | `The same course enrolled twice appears once` |
| US-7.1 | Student has no enrollments | `frontend/tests/MyCourses.test.js` | `Student has no enrollments` |
| US-7.1 | Dropping the last section removes the course | `backend/tests/myCourses.test.js` | `Dropping the last section removes the course` |
| US-7.1 | Unauthenticated request is rejected | `backend/tests/myCourses.test.js` | `Unauthenticated request is rejected` |
| US-7.1 | Admin cannot list enrolled courses | `backend/tests/myCourses.test.js` | `Admin cannot list enrolled courses` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 7 from @features/feature-7-student-course-listing.md on branch `feature/7-student-course-listing`.

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
*   Admin course create, edit, delete, and the `/courses` catalogue page ([Feature 2](feature-2-course-management.md))
*   Enrolling, dropping, seat counts, and the per-semester schedule ([Feature 6](feature-6-enrollment-management.md))
*   Showing section number, meeting time, faculty, or the Feature 3 semester name on this list
*   Adding `userId` to `courses`
*   Profile management

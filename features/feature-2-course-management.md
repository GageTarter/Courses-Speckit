# Feature: Course Management

**Feature ID:** 2
**Branch pattern:** `feature/2-course-management`
**Status:** Draft
**Created:** 2026-9-24
**Input:** Courses created and managed by the users with admin privelages
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-2.1 Add a course
**As an** admin
**I want to** add a course with a required name and course ID, and an optional description and semester offered
**So that** I can use it during enrollment
**Priority:** P1
**Independent test:** Submit the Add Course dialogue and see the course in the Courses table
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2 Browse the courses list
**As a** signed-in user
**I want to** see every course with its name, ID, description and semester offered
**So that** I can see what courses are already in the system
**Priority:** P1
**Independent test:** Open the Courses page and confirm each row shows name, ID, description and semester offered
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3 Correct a course's data
**As an** admin
**I want to** edit a course's name, course ID, description, or semester offered
**So that** the course entries contain updated data
**Priority:** P2
**Independent test:** Edit one course's name, ID, description or semester offered and confirm the table shows the new value
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4 Remove a course
**As an** admin
**I want to** remove a course that is no longer provided
**So that** the old courses are not listed
**Priority:** P3
**Independent test:** Delete an unused course and confirm it leaves the Courses table
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** An admin must fill `name` and `courseID`. `description` and `semesterOffered` are optional.
-- **FR-002:** Created courses are shared. Every signed-in user can view every course. No course belongs to a specific user.
-- **FR-003:** Only an admin can create, edit, or delete a course. A signed-in non-admin can list courses and cannot change them.
-- **FR-004:** On edit, `name` and `courseID` are required. `description` and `semesterOffered` are optional; a blank value clears that field.
-- **FR-005:** Edited information must be updated in the affected course when a user with admin privelages makes a change.
-- **FR-006:** Course must be completely erased when the delete option is selected by the user with admin privelages.
-- **FR-007:** Created courses must be listed in alphabetical order.

---

## Assumptions

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

## Edge Cases
- Empty or whitespace-only `name` or `courseID` → `400`.
- Omitted, empty, or whitespace-only `description` or `semesterOffered` → accepted and stored as `null`.
- Name longer than 100 characters → `400`.
- Description longer than 300 characters → `400`.
- Non-numeric `:id` → `400`.
- `semesterOffered` present and not `YYYY-MM-DD` → `400`.

## Success Criteria
- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Every signed-in user can view every course on one screen. An admin can create, edit, and delete courses on that screen.
- **SC-003**: `npm test` passes for course API and dashboard courses-view behavior.

## Data Ownership & Isolation

Courses are a shared catalogue. A course has no owner and no `userId`. Every signed-in user sees the same rows (**FR-002**). Only an admin can create, edit, or delete (**FR-003**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /courseapi/courses` returns every course, ordered by `name` ascending (**FR-007**). Do not filter by `req.user.id` |
| **Write scope** | `PUT` / `DELETE /courseapi/courses/:id` update or erase the row with that primary key. Missing id → `404`. Caller must be an admin |
| **Create scope** | `POST /courseapi/courses` inserts a shared row. Do not set `userId` from the session or the body. Caller must be an admin |
| **Non-admin write** | A signed-in user who is not an admin → `403` on `POST`, `PUT`, and `DELETE` |
| **UI scope** | `CourseList.vue` shows the full list from the API. Show **+ New Course**, **Edit Course**, and **Delete course** only when the signed-in user is an admin |
| **Implementation** | Protect all four routes with `authenticateRoute`. Protect `POST`, `PUT`, and `DELETE` with `requireAdmin`. Do not scope queries by `req.user.id` |

Unauthenticated callers → `401`.

## Key Entities

-- **Course** shared catalogue entry. It has no owner.

## API Requirements

Mount prefix is `/courseapi` (existing `server.js` + `CourseServices.js`). Paths below match `backend/app/routes/course.routes.js`. All four endpoints require `Authorization: Bearer <token>`.

JSON property `courseID` matches the running app, the Data Model column `courseID`, and Gherkin.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courseapi/courses` | Yes | List every course, alphabetical by `name` (**FR-002**, **FR-007**, US-2.2) |
| `POST` | `/courseapi/courses` | Admin | Create a course (**FR-001**, **FR-003**, US-2.1) |
| `PUT` | `/courseapi/courses/:id` | Admin | Replace name, course ID, description, or semester offered of an existing course (**FR-004**, **FR-005**, US-2.3) |
| `DELETE` | `/courseapi/courses/:id` | Admin | Erase an existing course (**FR-003**, **FR-006**, US-2.4) |

`:id` is the numeric primary key. Non-numeric `:id` → `400` (Edge Cases). `courseID` is the separate string field (example `CMSC-1113-01`).

This feature does **not** add `GET /courseapi/courses/:id` or `DELETE /courseapi/courses` (delete-all). Those exist in the current backend but are not authorized by these FRs/Gherkin.

**Create request body:** `name` and `courseID` are required. `description` and `semesterOffered` may be omitted.
```json
{ "name": "Programming I", "courseID": "CMSC-1113-01", "description": "Introduction to programming", "semesterOffered": "2026-01-12" }
```

**Create success** (`201`):
```json
{ "id": 1, "name": "Programming I", "courseID": "CMSC-1113-01", "description": "Introduction to programming", "semesterOffered": "2026-01-12" }
```

**Update request body:** `name` and `courseID` are required. `description` and `semesterOffered` are optional; omit them or send them blank to store `null` (**FR-004**).

**Update success** (`200`) — same body the running app returns today:
```json
{ "message": "Course was updated successfully." }
```

**Delete success:** `200` or `204` (US-2.4). No requirement to return a message body.

**List success** (`200`): array of every course, sorted by `name` ascending. Empty catalogue → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`  
**Quoted validation (AC):**
- Name longer than 100 characters → `400` `{ "message": "Course name must be 100 characters or fewer." }`
- Description longer than 300 characters → `400` `{ "message": "Course description must be 300 characters or fewer." }`
- `semesterOffered` present and not `YYYY-MM-DD` → `400` `{ "message": "Semester offered must be a YYYY-MM-DD date." }`
- Non-numeric `:id` → `400` `{ "message": "Course id must be a number." }`
- Missing course id → `404` `{ "message": "Course not found." }`
- Signed-in non-admin `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin privileges are required." }`

**Other errors:** empty or whitespace-only `name` or `courseID` → `400`; blank `description` or `semesterOffered` → stored as `null`; unauthenticated → `401`; signed-in non-admin `POST` / `PUT` / `DELETE` → `403`; missing id → `404`. Flat JSON — no `{ success, data }` envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: Courses] — route name `courses`

*   **Route:** `/courses` → `frontend/src/views/CourseList.vue` (existing `router.js`).
*   **Heading:** **Courses**
*   **Purpose:** One screen where every signed-in user browses every course, and an admin creates, edits, and deletes courses (**SC-002**).
*   **Primary action:** **+ New Course** (`oc-cta`) — opens the add dialog (US-2.1).
*   **Table columns:** Name, CourseID, Description, SemesterOffered, Actions. Each row shows that course's name, course ID, description and semester offered (US-2.2).
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit Course** — `aria-label="Edit Course"`; opens the edit dialog (US-2.3).
    *   Delete icon on the row — `aria-label` **Delete course**; opens the delete confirm dialog (US-2.4).
*   **Add dialog:** fields Name, Course ID, Description, and Semester Offered. Name and Course ID are required. Description and Semester Offered are optional. Confirm submits create; **Close** dismisses without saving (existing dialog chrome). Dialog closes after a successful create.
*   **Edit dialog:** same four fields, prefilled from the row. Name and Course ID are required. Clearing Description or Semester Offered stores `null`. Confirm submits update; **Close** dismisses. Dialog closes after a successful update. Click target and title use **Edit Course**.
*   **Delete dialog:** confirm then call `DELETE`; cancel/close leaves the row in place.
*   **Inline validation** (no API request) — exact AC copy:
    *   **"Course name is required."**
    *   **"Course ID is required."**
*   **Empty state:** when no courses exist, the table shows no course rows (US-2.2 — "no courses should be displayed").
*   **Loading:** table or page loading indicator while `getCourses` is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.

Course ID is a required field the user fills (Gherkin example `CMSC-1113-01`).

**App chrome**

*   Existing `MenuBar` **Courses** button (`:to="{ name: 'courses' }"`) is how US-2.2 "open the courses menu" is reached. This feature does not add a new nav item.
*   MenuBar stays hidden on login (Feature 1). Courses navigation stays on Feature 2.

## Data Model Requirements

### `courses` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `name` | STRING(100) | Required; unique per (`name`); stored and displayed as typed |
| `courseID` | STRING(100) | Required; stored and displayed as typed |
| `description` | STRING(300) | Optional. `null` when omitted or blank. At most 300 characters when present |
| `semesterOffered` | DATEONLY | Optional. `null` when omitted or blank. When present, `YYYY-MM-DD` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

This feature does not associate **Course** with **User**. Courses have no owner and no `userId` column.

## Acceptance Criteria (Gherkin)

### US-2.1 — Add a catalogue course

#### Scenario: User creates a new course
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **+ New Course**
*   **And** I enter course name `Programming I`
*   **And** I enter course ID `CMSC-1113-01`
*   **And** I enter description `Introduction to programming`
*   **And** I enter semester offered `2026-01-16`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with a course object containing `id`, `name`, `courseID`, `description`, and `semesterOffered`
*   **And** `Programming I` appears in the courses view
*   **And** the add-course dialog closes

#### Scenario: User creates a course without a description or semester offered
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new course dialog
*   **And** I enter course name `Programming I`
*   **And** I enter course ID `CMSC-1113-01`
*   **And** I leave description and semester offered empty
*   **And** I confirm the dialog
*   **Then** the API returns `201`
*   **And** `description` and `semesterOffered` are `null`
*   **And** `Programming I` appears in the courses view

#### Scenario: User creates a course with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new course dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course name is required."**
*   **And** no API request is sent

#### Scenario: User creates a course with an empty course ID
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new course dialog
*   **And** I leave the courseID field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course ID is required."**
*   **And** no API request is sent

#### Scenario: User creates a course with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new course dialog
*   **And** I fill the course name with the name of an existing course
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course name is in use. Enter a different course name."**
*   **And** no API request is sent

#### Scenario: User creates a course with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a course name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Course name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a course with a description that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a course description longer than 300 characters
*   **Then** the API returns `400` with `{ "message": "Course description must be 300 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a course with an invalid semester offered
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a semester offered that is not `YYYY-MM-DD`
*   **Then** the API returns `400` with `{ "message": "Semester offered must be a YYYY-MM-DD date." }`
*   **And** the error is displayed in a `<v-alert type="error">`
*   **And** the course is not created

#### Scenario: Non-admin cannot create a course
*   **Given** I am signed in as a non-admin
*   **When** I send `POST /courseapi/courses` with a name and course ID
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the course is not created

---

### US-2.2 — Browse the Course List

#### Scenario: User views existing courses
*   **Given** I am signed in on the dashboard
*   **When** I open the courses menu
*   **Then** existing courses are displayed in alphabetical order

#### Scenario: There are no existing courses
*   **Given** I am signed in on the dashboard
*   **When** I open the courses menu
*   **Then** no courses should be displayed

### US-2.3 — Correct a course's name, ID, description or semester Offered

#### Scenario: User edits a course's information
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **Edit Course** on an existing course
*   **And** I change any of the original values
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "Course was updated successfully." }`
*   **And** the course is visible with updated information in the courses view
*   **And** the edit-course dialog closes

#### Scenario: User clears a course's description and semester offered
*   **Given** I am signed in as an admin on the dashboard
*   **And** a course has a description and a semester offered
*   **When** I open the edit course dialog
*   **And** I clear description and semester offered
*   **And** I leave name and course ID filled
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "Course was updated successfully." }`
*   **And** that course's `description` and `semesterOffered` are `null` in the courses view

#### Scenario: User edits a course with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit course dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course name is required."**
*   **And** no API request is sent

#### Scenario: User edits a course with an empty course ID
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit course dialog
*   **And** I leave the courseID field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course ID is required."**
*   **And** no API request is sent

#### Scenario: User edits a course with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit course dialog
*   **And** I enter the name of an exsting course
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Course name is in use. Enter a different course name."**
*   **And** no API request is sent

#### Scenario: User edits a course with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a course name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Course name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a course with a description that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a course description longer than 300 characters
*   **Then** the API returns `400` with `{ "message": "Course description must be 300 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a course with an invalid semester offered
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a semester offered that is not `YYYY-MM-DD`
*   **Then** the API returns `400` with `{ "message": "Semester offered must be a YYYY-MM-DD date." }`
*   **And** the error is displayed in a `<v-alert type="error">`
*   **And** the course keeps its previous semester offered

#### Scenario: User updates a course with a non-numeric id
*   **Given** I am signed in as an admin
*   **When** I send `PUT /courseapi/courses/abc`
*   **Then** the API returns `400` with `{ "message": "Course id must be a number." }`
*   **And** no course is changed

#### Scenario: User updates a course that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `PUT /courseapi/courses/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "Course not found." }`
*   **And** no course is changed

#### Scenario: Non-admin cannot edit a course
*   **Given** I am signed in as a non-admin
*   **And** a course exists
*   **When** I send `PUT /courseapi/courses/:id` for that course
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the course is unchanged

### US-2.4 Remove a course

#### Scenario: User removes a course
*   **Given** I am signed in as an admin
*   **And** I have access to course `Programming I `
*   **When** I click the delete icon on the `Programming I` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the course is removed from the courses view

#### Scenario: User deletes a course with a non-numeric id
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /courseapi/courses/abc`
*   **Then** the API returns `400` with `{ "message": "Course id must be a number." }`
*   **And** no course is removed

#### Scenario: User deletes a course that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /courseapi/courses/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "Course not found." }`
*   **And** no course is removed

#### Scenario: Non-admin cannot remove a course
*   **Given** I am signed in as a non-admin
*   **And** a course named `Programming I` exists
*   **When** I send `DELETE /courseapi/courses/:id` for that course
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** `Programming I` is still listed

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | User creates a new course | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User creates a new course")` |
| US-2.1 | User creates a course without a description or semester offered | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User creates a course without a description or semester offered")` |
| US-2.1 | User creates a course with an empty name | `frontend/tests/CourseList.test.js` | `it("User creates a course with an empty name")` |
| US-2.1 | User creates a course with an empty courseID | `frontend/tests/CourseList.test.js` | `it("User creates a course with an empty courseID")` |
| US-2.1 | User creates a course with an existing name | `frontend/tests/CourseList.test.js` | `it("User creates a course with an existing name")` |
| US-2.1 | User creates a course with a name that is too long | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User creates a course with a name that is too long")` |
| US-2.1 | User creates a course with a description that is too long | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User creates a course with a description that is too long")` |
| US-2.1 | User creates a course with an invalid semester offered | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User creates a course with an invalid semester offered")` |
| US-2.1 | Non-admin cannot create a course | `backend/tests/courses.test.js` | `it("Non-admin cannot create a course")` |
| US-2.2 | User views existing courses | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User views existing courses")` |
| US-2.2 | There are no existing courses | `frontend/tests/CourseList.test.js` | `it("There are no existing courses")` |
| US-2.3 | User edits a course's information | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User edits a course's information")` |
| US-2.3 | User clears a course's description and semester offered | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User clears a course's description and semester offered")` |
| US-2.3 | User edits a course with an empty name | `frontend/tests/CourseList.test.js` | `it("User edits a course with an empty name")` |
| US-2.3 | User edits a course with an empty courseID | `frontend/tests/CourseList.test.js` | `it("User edits a course with an empty courseID")` |
| US-2.3 | User edits a course with an existing name | `frontend/tests/CourseList.test.js` | `it("User edits a course with an existing name")` |
| US-2.3 | User edits a course with a name that is too long | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User edits a course with a name that is too long")` |
| US-2.3 | User edits a course with a description that is too long | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User edits a course with a description that is too long")` |
| US-2.3 | User edits a course with an invalid semester offered | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User edits a course with an invalid semester offered")` |
| US-2.3 | User updates a course with a non-numeric id | `backend/tests/courses.test.js` | `it("User updates a course with a non-numeric id")` |
| US-2.3 | User updates a course that does not exist | `backend/tests/courses.test.js` | `it("User updates a course that does not exist")` |
| US-2.3 | Non-admin cannot edit a course | `backend/tests/courses.test.js` | `it("Non-admin cannot edit a course")` |
| US-2.4 | User removes a course | `backend/tests/courses.test.js`; `frontend/tests/CourseList.test.js` | `it("User removes a course")` |
| US-2.4 | User deletes a course with a non-numeric id | `backend/tests/courses.test.js` | `it("User deletes a course with a non-numeric id")` |
| US-2.4 | User deletes a course that does not exist | `backend/tests/courses.test.js` | `it("User deletes a course that does not exist")` |
| US-2.4 | Non-admin cannot remove a course | `backend/tests/courses.test.js` | `it("Non-admin cannot remove a course")` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-course-management.md on branch `feature/2-course-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

## Out of Scope

*   Register, sign in, session persistence, and logout ([Feature 1](feature-1-user-authentification.md))
*   Bulk `DELETE /courseapi/courses` (delete-all) and `GET /courseapi/courses/:id`
*   Per-user course ownership (`userId` on `courses`)
*   Profile management

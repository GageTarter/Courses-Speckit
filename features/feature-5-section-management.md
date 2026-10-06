# Feature: Section Management

**Feature ID:** 5
**Branch pattern:** `feature/5-section-management`
**Status:** Draft
**Created:** 2026-09-23
**Input:** Let a signed-in admin create, read, update, and remove sections.
**Depends on:** Feature 1 — User Authentication & Session Management, Feature 2 — Semester Management, Feature 3 — Course Management, Feature 4 — Faculty Management. Those feature files are not in this repo yet.

**Related:** Feature 6 — Enrollment Management, Feature 7 — Student Course Listing, Feature 8 — Section Student Listing.  

---

## User Stories

### US-5.1: Create a Section
**As a** signed-in admin
**I want to** create a section with a section number, a semester (Fall, Winter, Spring, or Summer), a course ID, a faculty ID, days of the week, and a start time and end time.
**So that** I can record a section that is offered. 

**Priority:** P1
**Independent test:** Submit the Add Section dialog and see the new section on the Section page
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: See only my own Sections
**As a** signed-in admin
**I want to** see just the sections I created on the Sections page
**So that** my sections stay separate from other admins' sections. 

**Priority:** P1
**Independent test:** Sign in as one admin and confirm the page lists only that admin's sections.
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria


### US-5.3: Update a section's details
**As a** signed-in admin
**I want to** change a section's section number, semester (Fall, Winter, Spring, or Summer), course ID, faculty ID, days of the week, and start time and end time.
**So that** the section reflects how I want my section to look.

**Priority:** P1
**Independent test:** Change the section number, semester, course ID, faculty ID, days of the week, start time, and end time, and confirm the updated details are saved.
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Delete a Section
**As a** signed-in admin
**I want to** delete a section I no longer want
**So that** my Sections page stays limited to sections that are available this semester.

**Priority:** P2
**Independent test:** Delete one section and confirm it disappears from the Sections page.
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: An admin MUST be signed in to view, create, update, or delete a section.
- **FR-002**: The System MUST require `sectionNumber`, `semesterId`, `courseId`, `facultyId`, `daysOfWeek`, `startTime`, and `endTime` when creating a section. `sectionNumber` MUST be an integer from 1 through 99. `semesterId` MUST be `1` (Fall), `4` (Winter), `2` (Spring), or `3` (Summer). `courseId` and `facultyId` MUST be integers. `daysOfWeek` is sent as an array of day names and stored as one comma-separated string.
- **FR-003**: The System MUST reject a create request that omits a required field with `400` and a message naming that field (for example `"sectionNumber is required."`).
- **FR-004**: The System MUST set a new sections's owner from the authenticated session never from a `userId` supplied in the request body.
- **FR-005**: `startTime` and `endTime` MUST be same-day clock times chosen with the device time picker and MUST be stored and returned as `HH:MM` strings (for example `"11:40"`). The system MUST NOT convert them to minutes from midnight.
- **FR-006**: The system MUST require `startTime` to be earlier than `endTime` when creating or updating a section.
- **FR-007**: The system MUST list only sections owned by the signed-in admin (`userId` equals that admin).
- **FR-008**: The signed-in admin MUST be able to update `sectionNumber`, `semesterId`, `courseId`, `facultyId`, `daysOfWeek`, `startTime`, and `endTime` on sections they own. 
- **FR-009**: The system MUST return `400` when `startTime` is equal to or later than `endTime`.
- **FR-010**: The Sections page MUST display each section's section number as two digits (`01`), the semester name (Fall, Winter, Spring, or Summer), the numeric `courseId`, the numeric `facultyId`, the days of the week, the start time, and the end time.
- **FR-011**: The system MUST NOT let an admin read, update, or delete a section owned by another admin. Such a request MUST return `404` with `` `Cannot find section with id=${id}.` `` rather than `403`.
- **FR-012**: The system MUST return `404` with `` `Cannot find section with id=${id}.` `` when the requested section does not exist.
- **FR-013**: Deleting a section MUST also remove that sections's details,leaving no orphaned rows.
- **FR-014**: The system MUST use the authenticated admin's identity when determining which sections they can view, update, or delete.
- **FR-015**: The Sections page MUST let the owner delete a section only after they confirm in a dialog titled **Delete Section** whose body is `"Delete this section?"`. **Cancel** MUST send no request and MUST leave the section listed. **Delete Section** MUST send the delete request.
- **FR-016**: The system MUST return `400` with `"A section with this sectionNumber already exists for this course and semester."` when a create or update would duplicate `sectionNumber` for the same `courseId` and `semesterId`.

## Assumptions
- Feature 1 authentication and session handling MUST be merged to `dev` before implementing this feature.
- Only authenticated users with admin privileges can access Section Management.
-The admin’s identity is available through the authenticated session.
-Sections are associated with an existing semester, course, and faculty member.
-Section numbers are unique for each course and semester.
- `startTime` and `endTime` are 24-hour `HH:MM` clock times from the device time picker. The API stores and returns those strings unchanged.
-Admins can view, create, update, and delete sections according to the application’s authorization rules.


## Edge Cases
- An unauthenticated user attempts to access Section Management → redirect or `401`.
- An authenticated user without admin privileges attempts to access Section Management → `403`.
-The admin’s session is missing, expired, or contains an invalid identity → redirect or `401`.
- A section references a semester, course, or faculty member that does not exist → `400 `or `404`.
- A section number is missing, invalid, or contains an unsupported format → `400`.
- `startTime` or `endTime` is missing or is not `HH:MM` → client block and/or `400`.
-A section contains invalid or unexpected input, such as excessively long text or unsupported characters → client block and/or `400`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Signed-in admin can create, view, update, and delete sections  without seeing another user's data.
- **SC-003**: `npm test` passes for the sections API and the Sections page.
---


## Data Ownership & Isolation

Each admin owns their sections exclusively. Another authenticated admin must not be able to view, update, or delete them.

| Rule | Requirement |
|------|-------------|        
| **Read scope** |  returns only sections where `userId = req.user.id`. |
| **Write scope** | `PUT` and `DELETE` apply only when the section row matches both `id` and `req.user.id`. |   
| **Create scope** | New Sections are always owned by the authenticated admin. |
| **Cross-user access** | If a section belongs to another admin, respond with `404` — never `403` (do not confirm the section exists). |
| **UI scope** | The sections view shows only sections returned for the signed-in admin. |
| **Implementation** | Use a shared helper (e.g. `getAccessibleListOrNull(req, sectionId)`) in `app/authorization/` — do not duplicate scope logic in controllers. |

---

## Key Entities

-- **Sections** a course offering for a specific semester, with section number, assigned faculty member, meeting days and start and end times.
-- **Admin** owns and manages the section they create.


## API Requirements

Mount prefix is `/courses`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/sections` | Yes | List the sections owned by the signed-in admin |
| `POST` | `/courses/sections` | Yes | Create a new section |
| `PUT` | `/courses/sections/:id` | Yes | Update a section owned by the signed-in admin |
| `DELETE` | `/courses/sections/:id` | Yes | Delete a section owned by the signed-in admin |

`:id` is the section primary key. A non-numeric `id` MUST return `400` with `"Invalid section id."`.

This feature does not add `GET /courses/sections/:id` or delete-all.


**Create request body:**
```json
{ "sectionNumber": 1, "semesterId": 1, "courseId": 1, "facultyId": 1, "daysOfWeek": ["Monday", "Wednesday"], "startTime": "11:40", "endTime": "12:50" }
```
**Create success** (`201`):
```json
{ "id": 1, "sectionNumber": 1, "semesterId": 1, "courseId": 1, "facultyId": 1, "daysOfWeek": "Monday,Wednesday", "startTime": "11:40", "endTime": "12:50", "userId": 42 }
```
Returned `userId` MUST match the signed-in admin. Returned `daysOfWeek` is the stored string, not the request array.

**Update request body:** same fields as create (all required — FR-002).

**Update success** (200):
```JSON
{ "message": "Section was updated successfully." }
```
**Delete success** (`200`): `{ "message": "Section was deleted successfully." }`

**List success** (`200`): array of section objects for the caller only.Empty section list → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`
**Other errors:** empty or missing required fields on a request that reaches the API → `400`; unauthenticated → `401`; missing or not owned → `404` (do not use `403`). Flat JSON — no `{ success, data } `envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: Sections] — route name `sections`

*   **Route:** `/sections` → `frontend/src/views/SectionList.vue` (existing `router.js`).
*   **Heading:** **Sections**
*   **Purpose:** One screen to create, browse, edit, and delete the signed-in admin's sections (**SC-002**).
*   **Primary action:** **+ New Section** (`oc-cta`) — opens the add dialog (US-5.1).
*   **Table columns:** Section Number, Semester, Course, Faculty, Days of the Week, Start Time, End Time, Actions (US-5.2). Section Number displays as two digits (`1` shows as `01`). The stored value stays the integer. Semester displays as **Fall**, **Winter**, **Spring**, or **Summer**. Course displays `course.courseID` from the course list when that list loads, and the numeric `courseId` when it does not. Faculty displays the numeric `facultyId`.
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit section** — `aria-label="Edit section"`; opens the edit dialog (US-5.3).
    *   **Delete section** — `aria-label="Delete section"`; opens the delete confirm dialog (US-5.4).
*   **Add dialog:** title **Add Section**. Fields: Section Number, Semester, Course ID, Faculty ID, Days of the Week, Start Time, End Time, all required. **Semester** is a select of **Fall**, **Winter**, **Spring**, and **Summer** (`semesterId` `1`, `4`, `2`, and `3`). **Course** is a select of courses from `http://localhost:3200/courseapi/courses`. Each item shows `courseID` and name. The saved value is `course.id`. Faculty ID is a number input. **Start Time** and **End Time** use the device time picker (`type="time"`); the value sent and shown is `HH:MM` (for example `11:40`). **Create** submits create. **Cancel** dismisses without saving. The dialog closes after a successful create.
x*   **Edit dialog:** title **Edit Section**. Same fields as the add dialog, prefilled from the row. **Save Section** submits update. **Cancel** dismisses. The dialog closes after a successful update.
*   **Delete dialog:** title **Delete Section**, body `"Delete this section?"`. **Delete Section** calls `DELETE`. **Cancel** leaves the row in place.
*   **Inline validation:** required fields must be validated before sending the API request.
*   **Empty state:** `"No sections yet. Create your first section."` when the signed-in admin has no sections (US-5.2).
*   **Loading:** progress indicator while the sections request is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.


**App chrome**

*   Existing `MenuBar` **Sections** button (`:to="{ name: 'sections' }"`) is how US-5.2 "open the sections menu" is reached. This feature does not add a new nav item.
*   MenuBar stays hidden on login (Feature 1).


## Data Model Requirements

### `sections` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `userId` | INTEGER | Required, FK → `users.id`, `ON DELETE CASCADE` |
| `sectionNumber` | INTEGER | Required; integer from 1 through 99. The Sections page displays it as two digits (`01`) |
| `semesterId` | INTEGER | Required, FK → `semesters.id`. Offered values: `1` Fall, `4` Winter, `2` Spring, `3` Summer |
| `courseId` | INTEGER | Required, FK → `courses.id` |
| `facultyId` | INTEGER | Required, FK → `faculty.id` |
| `daysOfWeek` | STRING(100) | Required; comma-separated day names, for example `Monday,Wednesday` |
| `startTime` | STRING(5) | Required; `HH:MM` from the device time picker |
| `endTime` | STRING(5) | Required; `HH:MM`; must be later than `startTime` on the same day |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |


### Associations

*   **User** hasMany **Section**
*   **Section** belongsTo **User** (`userId`)
*   **Semester** hasMany **Section**
*   **Section** belongsTo **Semester** (`semesterId`)
*   **Course** hasMany **Section**
*   **Section** belongsTo **Course** (`courseId`)
*   **Faculty** hasMany **Section**
*   **Section** belongsTo **Faculty** (`facultyId`)

Unique constraint on (`sectionNumber`, `courseId`, `semesterId`): two different courses or semesters may have the same section number; the same section number may not be duplicated for the same course and semester.

## Acceptance Criteria (Gherkin)

### US-5.1 — Create a Section

#### Scenario: Admin creates a new section
*   **Given** I am signed in as an admin
*   **When** I click **+ New Section**
*   **And** I enter section number 1
*   **And** I select Fall
*   **And** I enter course ID 1
*   **And** I enter faculty ID 1
*   **And** I select Monday and Wednesday for Days of the Week
*   **And** I set Start Time to `11:40` with the time picker
*   **And** I set End Time to `12:50` with the time picker
*   **And** I click **Create**
*   **Then** the API returns `201` with a section object containing `id`, `sectionNumber`, `semesterId`, `courseId`, `facultyId`, `daysOfWeek`, `startTime`, `endTime`, and `userId`
*   **And** the returned `sectionNumber` is `1`, `semesterId` is `1`, `courseId` is `1`, and `facultyId` is `1`
*   **And** the returned `daysOfWeek` is `"Monday,Wednesday"`
*   **And** the returned `startTime` is `"11:40"` and `endTime` is `"12:50"`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** the Sections page shows section number `01`, semester Fall, course `1`, and faculty `1`
*   **And** the add-section dialog closes

#### Scenario: Admin creates a section with a missing required field
*   **Given** I am signed in as an admin
*   **When** I open the new section dialog
*   **And** I leave a required field empty
*   **And** I click **Create**
*   **Then** inline validation blocks the request
*   **And** no API request is sent

#### Scenario: Admin creates a duplicate section number for the same course and semester
*   **Given** I am signed in as an admin
*   **And** I already own a section with section number 1, semester Fall, and course ID 1
*   **When** I create another section with section number 1, semester Fall, and course ID 1
*   **Then** the API returns `400` with `{ "message": "A section with this sectionNumber already exists for this course and semester." }`
*   **And** the new section is not added

### US-5.2 — See only my own Sections

#### Scenario: Admin views existing sections
*   **Given** I am signed in as an admin
*   **And** I own at least one section
*   **When** I open the Sections page
*   **Then** sections created by me are displayed
*   **And** sections owned by another admin are not displayed

#### Scenario: Admin has no existing sections
*   **Given** I am signed in as an admin
*   **And** I own no sections
*   **When** I open the Sections page
*   **Then** `"No sections yet. Create your first section."` is displayed

### US-5.3 — Update a section's details

#### Scenario: Admin edits a section's information
*   **Given** I am signed in as an admin
*   **When** I click Edit section on an existing section
*   **And** I change any of the original values
*   **And** I click **Save Section**
*   **Then** the API returns `200` with `{ "message": "Section was updated successfully." }`
*   **And** the section is visible with updated information in the Sections view
*   **And** the edit-section dialog closes

#### Scenario: Admin edits a section with a missing required field
*   **Given** I am signed in as an admin
*   **When** I open the edit section dialog
*   **And** I leave a required field empty
*   **And** I click **Save Section**
*   **Then** inline validation blocks the request
*   **And** no API request is sent

### US-5.4 — Delete a Section

#### Scenario: Admin deletes a section
*   **Given** I am signed in as an admin
*   **And** I own a section
*   **When** I click the delete icon on the section row
*   **And** I click **Delete Section**
*   **Then** the API returns `200` with `{ "message": "Section was deleted successfully." }`
*   **And** the section is removed from the Sections view

#### Scenario: Admin cancels deleting a section
*   **Given** I am signed in as an admin
*   **And** I own a section
*   **When** I click the delete icon on the section row
*   **And** I click **Cancel**
*   **Then** no API request is sent
*   **And** the section remains on the Sections page

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | Admin creates a new section | `backend/tests/sections.test.js` | Admin creates a new section |
| US-5.1 | Admin creates a section with a missing required field | `frontend/tests/SectionList.test.js` | Admin creates a section with a missing required field |
| US-5.1 | Admin creates a duplicate section number for the same course and semester | `backend/tests/sections.test.js` | Admin creates a duplicate section number for the same course and semester |
| US-5.2 | Admin views existing sections | `frontend/tests/SectionList.test.js` | Admin views existing sections |
| US-5.2 | Admin has no existing sections | `frontend/tests/SectionList.test.js` | Admin has no existing sections |
| US-5.3 | Admin edits a section's information | `backend/tests/sections.test.js` | Admin edits a section's information |
| US-5.3 | Admin edits a section with a missing required field | `frontend/tests/SectionList.test.js` | Admin edits a section with a missing required field |
| US-5.4 | Admin deletes a section | `backend/tests/sections.test.js` | Admin deletes a section |
| US-5.4 | Admin cancels deleting a section | `frontend/tests/SectionList.test.js` | Admin cancels deleting a section |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-section-management.md on branch `feature/5-section-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`.

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

## Out of Scope

*   `GET /courses/sections/:id` and delete-all
*   A menu of faculty names (Feature 4 — Faculty Management)
*   A year on the semester, such as Fall 2026 (Feature 2 — Semester Management)
*   Enrollment (Feature 6 — Enrollment Management)
*   Student course listing (Feature 7 — Student Course Listing)
*   Section student listing (Feature 8 — Section Student Listing)
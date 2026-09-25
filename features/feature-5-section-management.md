# Feature: Section Management

**Feature ID:** 5
**Branch pattern:** `feature/5-section-management`
**Status:** Draft
**Created:** 2026-09-23
**Input:** Let a signed-in admin create, read, update, and remove sections.
**Depends on:** [Feature 1 — User Authentication & Session Management](./feature-list.md)
[Feature 2 — Semester Management](./feature-list.md)
[Feature 3 — Course Management](./feature-list.md)
[Feature 4 — Faculty Management](./feature-list.md)

**Related:** [Feature 2 — Semester Management](./feature-list.md) 
[Feature 3 — Course Management](./feature-list.md) 
[Feature 4 — Faculty Management](./feature-list.md) 
[Feature 6 — Enrollemnt Management](./feature-list.md) 
[Feature 7 — Student Course Listing](./feature-list.md)
[Feature 8 — Section Student Listing](./feature-list.md)  

---

## User Stories

### US-5.1: Create a Section
**As a** signed-in user
**I want to** create a section with a section number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time.
**So that** I create a section to record an anvailable section. 

**Priority:** P1
**Independent test:** Submit the Add Section dialog and see the new section on the Section page
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: See only my own Sections
**As a** signed-in user
**I want to** see just the sections I created on the Sections page
**So that** my sections stay separate from other admins' sections. 

**Priority:** P1
**Independent test:** Sign in as one user and confirm the page lists only that user's sections.
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria


### US-5.3: Update a section's details
**As a** signed-in user
**I want to** change a section's number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time.
**So that** the section reflects how I want my section to look.

**Priority:** P1
**Independent test:** Change the section number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time and confirmthe updated details are saved.
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Delete a Section
**As a** signed-in user
**I want to** delete a section I no longer want
**So that** my Sections page stays limited to sections that are available this semester.

**Priority:** P2
**Independent test:** Delete one section and confirm it disappears from the Sections page.
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Admin Users MUST be signed in to create, update, or delete a section.
- **FR-002**: The System MUST require `section number`, `semesterId`, `courseId`, `facultyId`,`daysOfweek`,`startTime` and `endTime` when creating a section.
- **FR-003**: The System MUST reject a create request that omits a required field with `400` and a message naming that field (for example `"Name cannot be empty for section!"`).
- **FR-004**: The System MUST set a new sections's owner from the authenticated session never from a `userId` supplied in the request body.
- **FR-005**: `startTime` and ` endTime` MUST represent the section’s start and end times in minutes from midnight and MUST define a valid time range within the day.
-**FR-006**:The system MUST require startTime to be earlier than endTime when creating or updating a section.
- **FR-007**: The section MUST list only sections owned by the signed admin.
- **FR-008**:  The users MUST be able to update `section number`, `semesterId`, `courseId`, `facultyId`,`daysOfweek`,`startTime` and `endTime` they own. 
- **FR-009**:The system MUST return `400` when startTime is equal to or later than endTime.
- **FR-010**: The Sections page MUST display the section number, semester, course, faculty, days of the week, start time, and end time for each section.
- **FR-011**: The System MUST NOT let a user read, update, or delete a section owned by another user; such a request MUST return `404` with `` `Cannot find section with id=${id}.` `` rather than `403`.
- **FR-012**: The system MUST return `404` with `` `Cannot find Section with id=${id}.` `` when the requested section does not exist.
- **FR-013**: Deleting a section MUST also remove that sections's details,leaving no orphaned rows.
- **FR-014**:The system MUST use the authenticated user’s identity when determining which sections they can view, update, or delete.
**FR-015**The Sections page MUST let the owner delete a section only after they confirm in a dialog that names the section; cancelling MUST send no request and MUST leave the section listed.

## Assumptions
- Feature 1 authentication and session handling MUST be merged to `dev` before implementing this feature.
- Only authenticated users with admin privileges can access Section Management.
-The admin’s identity is available through the authenticated session.
-Sections are associated with an existing semester, course, and faculty member.
-Section numbers are unique for each course and semester.
-startTime and endTime represent times during the day and use the system’s supported time format.
-Admins can view, create, update, and delete sections according to the application’s authorization rules.


## Edge Cases
- An unauthenticated user attempts to access Section Management → redirect or `401`.
- An authenticated user without admin privileges attempts to access Section Management → `403`.
-The admin’s session is missing, expired, or contains an invalid identity → redirect or `401`.
- A section references a semester, course, or faculty member that does not exist → `400 `or `404`.
- A section number is missing, invalid, or contains an unsupported format → `400`.
-A section contains invalid or unexpected input, such as excessively long text or unsupported characters → client block and/or `400`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Signed-in admin can create, view, update, and delete sections  without seeing another user's data.
- **SC-003**: `npm test` passes for sections API and dashboard lists-view behavior.
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

Mount prefix is `/sectionapi` 
JSON property `unit` matches the running app, the Data Model column `unit`, and Gherkin.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/sectionapi/sections` | Yes | List the sections  owned by the signed-in admin
| `POST` | `/sectionapi/sections` | Yes | Create a new section
| `PUT` | `/sectionapi/sections/:id` | Yes | Update a section owned by the signed-in admmin
| `DELETE` | `/sectionapi/sections/:id` | Yes | Delete a sction owned by the signed-in admin.
`:id` is the sections primary key. Non-numeric / invalid `sectionId` → `400` (Edge Cases).

This feature does **not** add `GET /sectionapi/sectionss/:id` or `DELETE /sectionapi/sectionss` (delete-all). Those exist in the current backend but are not authorized by these FRs/Gherkin.


**Create request body:**
```json
{ "sectionNumber": 1, "semesterId": 1, "courseId": 1"facultyId": 1,"daysOfWeek": ["Monday", "Wednesday"], "startTime": 11:40, "endTime": 12:50 }
```
**Create success** (`201`):
```json
{ "id": 1, "sectionNumber": 1, "semesterId": 1, "courseId": 1, "facultyId": 1, "daysOfWeek": ["Monday", "Wednesday"], "startTime": 540, "endTime": 590, "userId": 42 }
```
Returned userId MUST match the authenticated user.

**Update request body:**  same fields as create (all required — FR-007).

**Update success** (200):
```JSON
{ "message": "Section was updated successfully." }
```
**Delete success:** `200` or `204` (US-5.4). No requirement to return a message body.

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
*   **Table columns:** Section Number, Semester, Course, Faculty, Days of the Week, Start Time and End Time, Actions.  (US-5.2).
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit Section** — `aria-label="Edit Section"`; opens the edit dialog (US-5.3).
    *   Delete icon on the row — `aria-label` **Delete ingredient**; opens the delete confirm dialog (US-5.4).
*   **Add dialog:**  fields Section Number, Semester, Course, Faculty, Days of the Week, Start Time and End Time, all required. Confirm submits create; **Close** dismisses without saving (existing dialog chrome). Dialog closes after a successful create.
*   **Edit dialog:** same fields as the create dialog, prefilled from the row. Confirm submits update; **Close** dismisses. Dialog closes after a successful update. Click target and title use **Edit Sections**.
*   **Delete dialog:** confirm then call `DELETE`; cancel/close leaves the row in place.
*   **Inline validation** required fields must be validated before sending API request.
*   **Empty state:** when the signed-in admin has no sections the table shows no section rows (US-5.2 — "no sections should be displayed").
*   **Loading:** table or page loading indicator while the sectiosrequrdt is in flight.
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
| `sectionNum` | STRING(100) | Required |
| `semesterId` | INTEGER | Required, FK → `semesters.id` |
| `courseId` | INTEGER | Required, FK → `courses.id` |
| `facultyId` | INTEGER | Required, FK → `faculty.id` |
| `daysOfWeek` | STRING(100) | Required |
| `startTime` | INTEGER | Required; time in minutes from midnight |
| `endTime` | INTEGER | Required; time in minutes from midnight; must be later than `startTime` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |


### Associations

*   **User** hasMany **Section**
*   **Section** belongsTo **User** (`userId`)
*   **Semester** hasMany **Section**
*   **Section** belongsTo **Semester** (`semesterId`)
*   **User**    hasMany    **Section**
*   **Section** belongsTo **User** (`userId`)
*   **Semester** hasMany **Section**
*   **Section** belongsTo **Semester** (`semesterId`)
*   **Course** hasMany **Section**
*   **Section** belongsTo **Course** (`courseId`)
*   **Faculty** hasMany **Section**
**  **Section** belongsTo **Faculty** (`facultyId`)

Unique constraint on (`sectionNum`, `courseId`, `semesterId`): two different courses or semesters may have the same section number; the same section number may not be duplicated for the same course and semester.

## Acceptance Criteria (Gherkin)


### US-5.1 — Create a Section
### Scenario: Admin creates a new section
*   **Given** I am signed in as an admin
*   **When** I click + New Section
*   **And** I enter section number 1
*   **And** I enter semester ID 1
*   **And** I enter course ID 1
*   **And** I enter faculty ID 1
*   **And** I enter the available days of the week
*   **And** I enter a start time
*   **And** I enter an end time
*   **And** I confirm the dialog
*   **Then** the API returns 201 with a section object containing`'id`, `sectionNum`, `semesterId`, `courseId`, `facultyId`, `daysOfWeek`, `startTime`, `endTime`, and `userId`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** the section appears in the Sections view
*   **And** the add-section dialog closes

### Scenario: Admin creates a section with a missing required field

*   **Given** I am signed in as an admin
*   **When** I open the new section dialog
*   **And** I leave a required field empty
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** no API request is sent


### US-5.2 — Browse Sections

### Scenario: Admin views existing sections
*   **Given** I am signed in as an admin
*   **When** I open the Sections page
*   **Then** sections created by me are displayed

### Scenario: Admin has no existing sections
*   **Given** I am signed in as an admin
*   **When** I open the Sections page
*   **Then** no sections should be displayed

### US-5.3 — Update a Section’s Details

### Scenario: Admin edits a section’s information
*   **Given** I am signed in as an admin
*   **When** I click Edit Section on an existing section
And I change any of the original values
And I confirm the dialog
Then the API returns `200 `with { `"message": "Section was updated successfully."` }
*   **And** the section is visible with updated information in the Sections view
*   **And** the edit-section dialog closes

### Scenario: Admin edits a section with a missing required field
*   **Given** I am signed in as an admin
*   **When** I open the edit section dialog
*   **And** I leave a required field empty
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   ***And** no API request is sent


### US-5.4 — Delete a Section

### Scenario: Admin deletes a section
*   **Given** I am signed in as an admin
*   **And** I own a section
*   **When** I click the delete icon on the section row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the section is removed from the Sections view


## Test Coverage Map
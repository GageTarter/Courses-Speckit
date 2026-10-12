# Feature: Faculty Management

**Feature ID:** 4
**Branch pattern:** `feature/4-faculty-management`
**Status:** Draft
**Created:** 2026-10-05
**Input:** Let a signed-in admin create, read, update, and remove faculty members so sections can assign a faculty person by id.
**Depends on:** [Feature 1 — User Authentication](./feature-1-user-auth.md)
**Related:** Feature 5 — Section Management (uses `facultyId`), [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-4.1: Add a faculty member
**As a** signed-in admin
**I want to** add a faculty member with a first name, last name, and department
**So that** I can assign that person to a section
**Priority:** P1
**Independent test:** Submit the Add Faculty dialog and see the faculty member in the Faculty table
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Browse the faculty list
**As a** signed-in admin
**I want to** see every faculty member with first name, last name, and department
**So that** I know who can teach a section
**Priority:** P1
**Independent test:** Open the Faculty page and confirm each row shows first name, last name, and department
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Correct a faculty member's details
**As a** signed-in admin
**I want to** edit a faculty member's first name, last name, or department
**So that** the faculty list stays accurate
**Priority:** P2
**Independent test:** Edit one faculty row and confirm the table shows the new values
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Remove a faculty member
**As a** signed-in admin
**I want to** remove a faculty member who is no longer needed
**So that** the old person is not listed
**Priority:** P3
**Independent test:** Delete a faculty member and confirm that row leaves the Faculty table
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: An admin MUST be signed in to view, create, update, or delete a faculty member.
- **FR-002**: The system MUST require `firstName`, `lastName`, and `dept` when creating or updating a faculty member.
- **FR-003**: Created faculty are a shared catalogue. Every signed-in admin can view every faculty member. A faculty row has no owner and no `userId`.
- **FR-004**: Only an admin can view, create, edit, or delete a faculty member. A signed-in non-admin cannot access Faculty Management.
- **FR-005**: On edit, `firstName`, `lastName`, and `dept` are required.
- **FR-006**: Edited information MUST be saved on the affected faculty row when an admin confirms the edit.
- **FR-007**: A faculty member MUST be completely erased when an admin confirms delete.
- **FR-008**: Faculty MUST be listed in alphabetical order by `lastName`, then `firstName`.
- **FR-009**: The system MUST reject a create or update that omits a required field with `400` and a message naming that field (for example `"firstName is required."`).
- **FR-010**: The Faculty page MUST display each faculty member's `firstName`, `lastName`, and `dept`.

## Assumptions

- Feature 1 authentication and session handling MUST be merged to `dev` before implementing this feature.
- Only authenticated users with admin privileges can access Faculty Management (view, create, edit, or delete).
- Faculty members are referenced later by Section Management through `facultyId` (Feature 5).
- Deleting a faculty member who is still referenced by a section is out of scope for conflict messaging beyond a normal database/API failure, unless a later feature adds that rule.

## Edge Cases

- An unauthenticated user attempts to access Faculty Management → redirect or `401`.
- A signed-in non-admin attempts `GET`, `POST`, `PUT`, or `DELETE` → `403`.
- A signed-in non-admin opens `/faculty` → redirect to home.
- Empty or whitespace-only `firstName`, `lastName`, or `dept` → `400`.
- `firstName`, `lastName`, or `dept` longer than 100 characters → `400`.
- Non-numeric `:id` → `400` with `"Invalid faculty id."`.
- Missing faculty id → `404` with `"Cannot find faculty with id=${id}."`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can view every faculty member on one screen and can create, edit, and delete faculty on that screen. Students cannot open Faculty Management.
- **SC-003**: `npm test` passes for the faculty API and the Faculty page.

---

## Data Ownership & Isolation

Faculty are a shared catalogue among admins. A faculty member has no owner and no `userId`. Every signed-in admin sees the same rows (**FR-003**). Only an admin can view, create, edit, or delete (**FR-004**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /courses/facultyapi/faculties` returns every faculty member, ordered by `lastName` then `firstName` ascending (**FR-008**). Do not filter by `req.user.id`. Caller must be an admin |
| **Write scope** | `PUT` / `DELETE /courses/facultyapi/faculties/:id` update or erase the row with that primary key. Missing id → `404`. Caller must be an admin |
| **Create scope** | `POST /courses/facultyapi/faculties` inserts a shared row. Do not set `userId` from the session or the body. Caller must be an admin |
| **Non-admin access** | A signed-in user who is not an admin → `403` on `GET`, `POST`, `PUT`, and `DELETE`. UI redirects non-admins away from `/faculty` |
| **UI scope** | `FacultyList.vue` is an admin-only screen. Show **+ New Faculty**, **Edit faculty**, and **Delete faculty** for the signed-in admin |
| **Implementation** | Protect all four routes with `authenticate` and `requireAdmin`. Do not scope queries by `req.user.id` |

Unauthenticated callers → `401`.

## Key Entities

- **Faculty** — a shared catalogue person with a first name, last name, and department. It has no owner.

## API Requirements

Mount prefix is `/courses/facultyapi`. The app mounts routes under `/courses` in `server.js`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/facultyapi/faculties` | Admin | List every faculty member, alphabetical by last name then first name (**FR-003**, **FR-008**, US-4.2) |
| `POST` | `/courses/facultyapi/faculties` | Admin | Create a faculty member (**FR-001**, **FR-002**, **FR-004**, US-4.1) |
| `PUT` | `/courses/facultyapi/faculties/:id` | Admin | Replace first name, last name, or department of an existing faculty member (**FR-005**, **FR-006**, US-4.3) |
| `DELETE` | `/courses/facultyapi/faculties/:id` | Admin | Erase an existing faculty member (**FR-004**, **FR-007**, US-4.4) |

`:id` is the numeric primary key. Non-numeric `:id` → `400` with `"Invalid faculty id."`.

This feature does **not** add `GET /courses/facultyapi/faculties/:id` or delete-all.

**Create / update request body:**
```json
{ "firstName": "Ada", "lastName": "Lovelace", "dept": "Computer Science" }
```

**Create success** (`201`):
```json
{ "id": 1, "firstName": "Ada", "lastName": "Lovelace", "dept": "Computer Science" }
```

**Update success** (`200`):
```json
{ "message": "Faculty was updated successfully." }
```

**Delete success** (`200`):
```json
{ "message": "Faculty was deleted successfully." }
```

**List success** (`200`): array of every faculty member, sorted by `lastName` then `firstName` ascending. Empty catalogue → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`

**Quoted validation:**
- Missing `firstName` → `400` `{ "message": "firstName is required." }`
- Missing `lastName` → `400` `{ "message": "lastName is required." }`
- Missing `dept` → `400` `{ "message": "dept is required." }`
- Field longer than 100 characters → `400` with a message naming that field
- Non-numeric `:id` → `400` `{ "message": "Invalid faculty id." }`
- Missing id → `404` `{ "message": "Cannot find faculty with id=${id}." }`
- Signed-in non-admin `GET` / `POST` / `PUT` / `DELETE` → `403` `{ "message": "Forbidden! Admin access required." }`

**Other errors:** empty or whitespace-only required fields → `400`; unauthenticated → `401`. Flat JSON — no `{ success, data }` envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: Faculty] — route name `faculty`

*   **Route:** `/faculty` → `frontend/src/views/FacultyList.vue`.
*   **Heading:** **Faculty**
*   **Purpose:** One screen where a signed-in admin browses every faculty member and creates, edits, and deletes faculty (**SC-002**).
*   **Primary action:** **+ New Faculty** (`oc-cta`) — opens the add dialog (US-4.1).
*   **Table columns:** First Name, Last Name, Department, Actions (US-4.2).
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit faculty** — `aria-label="Edit faculty"`; opens the edit dialog (US-4.3).
    *   **Delete faculty** — `aria-label="Delete faculty"`; opens the delete confirm dialog (US-4.4).
*   **Add dialog:** title **Add Faculty**. Fields: First Name, Last Name, Department — all required. **Create** submits create. **Cancel** dismisses without saving. The dialog closes after a successful create.
*   **Edit dialog:** title **Edit Faculty**. Same fields, prefilled from the row. **Save Faculty** submits update. **Cancel** dismisses. The dialog closes after a successful update.
*   **Delete dialog:** title **Delete Faculty**, body `"Delete this faculty member?"`. **Delete Faculty** calls `DELETE`. **Cancel** leaves the row in place.
*   **Inline validation:** required fields must be validated before sending the API request. Exact copy examples: `"First name is required."`, `"Last name is required."`, `"Department is required."`
*   **Empty state:** `"No faculty yet. Create your first faculty member."` when the catalogue is empty (US-4.2).
*   **Loading:** progress indicator while the faculty request is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.

**App chrome**

*   `MenuBar` **Faculty** button (`:to="{ name: 'faculty' }"`) reaches US-4.2. Shown only when `role === "admin"`.
*   Router sends non-admins who open `/faculty` to home.
*   MenuBar stays hidden on login (Feature 1).

## Data Model Requirements

### `faculties` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `firstName` | STRING(100) | Required; stored and displayed as typed |
| `lastName` | STRING(100) | Required; stored and displayed as typed |
| `dept` | STRING(100) | Required; department name; stored and displayed as typed |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

This feature does not associate **Faculty** with **User**. Faculty have no owner and no `userId` column.

Feature 5 — Section Management associates **Section** belongsTo **Faculty** (`facultyId` → `faculties.id`). That FK is owned by Feature 5.

## Acceptance Criteria (Gherkin)

### US-4.1 — Add a faculty member

#### Scenario: Admin creates a new faculty member
*   **Given** I am signed in as an admin
*   **When** I click **+ New Faculty**
*   **And** I enter first name `Ada`
*   **And** I enter last name `Lovelace`
*   **And** I enter department `Computer Science`
*   **And** I click **Create**
*   **Then** the API returns `201` with a faculty object containing `id`, `firstName`, `lastName`, and `dept`
*   **And** `Ada`, `Lovelace`, and `Computer Science` appear in the faculty view
*   **And** the add-faculty dialog closes

#### Scenario: Admin creates a faculty member with a missing required field
*   **Given** I am signed in as an admin
*   **When** I open the new faculty dialog
*   **And** I leave a required field empty
*   **And** I click **Create**
*   **Then** inline validation blocks the request
*   **And** no API request is sent

#### Scenario: Non-admin cannot create a faculty member
*   **Given** I am signed in as a non-admin
*   **When** I send `POST /courses/facultyapi/faculties` with a first name, last name, and department
*   **Then** the API returns `403` with `{ "message": "Forbidden! Admin access required." }`
*   **And** the faculty member is not created

---

### US-4.2 — Browse the faculty list

#### Scenario: Admin views existing faculty
*   **Given** I am signed in as an admin
*   **And** faculty members exist
*   **When** I open the faculty menu
*   **Then** existing faculty are displayed in alphabetical order by last name then first name
*   **And** each row shows first name, last name, and department

#### Scenario: Admin has no existing faculty
*   **Given** I am signed in as an admin
*   **And** there are no faculty members
*   **When** I open the faculty menu
*   **Then** I see `"No faculty yet. Create your first faculty member."`

#### Scenario: Non-admin cannot list faculty
*   **Given** I am signed in as a non-admin
*   **When** I send `GET /courses/facultyapi/faculties`
*   **Then** the API returns `403` with `{ "message": "Forbidden! Admin access required." }`

---

### US-4.3 — Correct a faculty member's details

#### Scenario: Admin edits a faculty member's information
*   **Given** I am signed in as an admin
*   **When** I click **Edit faculty** on an existing faculty member
*   **And** I change the first name, last name, or department
*   **And** I click **Save Faculty**
*   **Then** the API returns `200` with `{ "message": "Faculty was updated successfully." }`
*   **And** the faculty row shows the updated information
*   **And** the edit-faculty dialog closes

#### Scenario: Admin edits a faculty member with a missing required field
*   **Given** I am signed in as an admin
*   **When** I open the edit faculty dialog
*   **And** I leave a required field empty
*   **And** I click **Save Faculty**
*   **Then** inline validation blocks the request
*   **And** no API request is sent

---

### US-4.4 — Remove a faculty member

#### Scenario: Admin deletes a faculty member
*   **Given** I am signed in as an admin
*   **And** a faculty member exists
*   **When** I click **Delete faculty**
*   **And** I confirm in the delete dialog
*   **Then** the API returns `200` with `{ "message": "Faculty was deleted successfully." }`
*   **And** that faculty member is no longer listed

#### Scenario: Admin cancels deleting a faculty member
*   **Given** I am signed in as an admin
*   **And** a faculty member exists
*   **When** I click **Delete faculty**
*   **And** I click **Cancel**
*   **Then** no delete request is sent
*   **And** the faculty member remains listed

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | Admin creates a new faculty member | `backend/tests/faculties.test.js` | Admin creates a new faculty member |
| US-4.1 | Admin creates a faculty member with a missing required field | `frontend/tests/FacultyList.test.js` | Admin creates a faculty member with a missing required field |
| US-4.1 | Non-admin cannot create a faculty member | `backend/tests/faculties.test.js` | Non-admin cannot create a faculty member |
| US-4.2 | Admin views existing faculty | `frontend/tests/FacultyList.test.js` | Admin views existing faculty |
| US-4.2 | Admin has no existing faculty | `frontend/tests/FacultyList.test.js` | Admin has no existing faculty |
| US-4.2 | Non-admin cannot list faculty | `backend/tests/faculties.test.js` | Non-admin cannot list faculty |
| US-4.3 | Admin edits a faculty member's information | `backend/tests/faculties.test.js` | Admin edits a faculty member's information |
| US-4.3 | Admin edits a faculty member with a missing required field | `frontend/tests/FacultyList.test.js` | Admin edits a faculty member with a missing required field |
| US-4.4 | Admin deletes a faculty member | `backend/tests/faculties.test.js` | Admin deletes a faculty member |
| US-4.4 | Admin cancels deleting a faculty member | `frontend/tests/FacultyList.test.js` | Admin cancels deleting a faculty member |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-faculty-management.md on branch `feature/4-faculty-management`.

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

*   `GET /courses/facultyapi/faculties/:id` and delete-all
*   Faculty login accounts (Feature 1 roles stay `student` and `admin` only)
*   Enrollment (Feature 6 — Enrollment Management)
*   Student course listing (Feature 7 — Student Course Listing)
*   Section student listing (Feature 8 — Section Student Listing)

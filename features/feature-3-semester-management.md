# Feature: Semester Management

  

**Feature ID:** 3

**Branch pattern:** `feature/3-semester-management`

**Status:** Ready

**Created:** 2026-09-17

**Input:** semesters created and managed by the user currently signed in

**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)

**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

  

---

  

## User Stories

  

### US-5.1: View created semesters

**As a** Authorized User  

**I want to** view the list of created semesters  

**So that** I can keep track of which semesters the software knows about

  

**Priority:** P1  

**Independent test:** Display all created semesters  

**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

  

### US-5.2 Edit existing semesters

**As a** Authorized User

**I want to** be able to edit the values of any created semester  

**So that** I can change the values, such as the semester name and start/end dates, of any created semester, to be different than what was inputted on creation

  

**Priority:** P1  

**Independent test:** Edit the existing semesters  

**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

  

### US-5.3 Delete existing semesters

**As a** Authorized User  

**I want to** delete any of the existing semesters

**So that** I can no longer see or include them in the semester list

  

**Priority:** P1  

**Independent test:** Delete any existing semester and clear its data  

**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

  

---

  

## Requirements

  

## Functional Requirements

  

-- **FR-001:** User must fill all fields, including the name, start date, and end date.

-- **FR-002:** Created semesters must be stored for each university so that users can view and manage semesters whenever they are signed in.

-- **FR-003:** Created semesters must be accessible only to and by all authorized users.

-- **FR-004:** User must fill all fields when making edits to an existing semester.

-- **FR-005:** Edited information must be updated in the affected semester when a user makes a change.

-- **FR-006:** semester must be completely erased when the delete option is selected by the user.

-- **FR-007:** Created semesters must be listed in reverse chronological order.

  

---

  

## Assumptions

  

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

- Feature 4 semester catalogue management MUST be merged to 'dev' before implementing this feature.

  

## Edge Cases

- Empty or whitespace-only semester data fields → `400`.

- Name or unit longer than 100 characters → `400`.

- `pricePerUnit` that is not a number → `400`.

- Invalid `semesterId` → `400`.

  

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.

- **SC-002**: Signed-in user can create, view, edit, and delete semesters on one screen without being able to access other users' private courses and semesters.

- **SC-003**: `npm test` passes for semester API and dashboard semesters-view behavior.

  

---

  

## Key Entities

  

-- **semester** named group belonging to one user (from Feature 4).

-- **User** owns many semesters (from Feature 1).

  

---

  

## Acceptance Criteria (Gherkin)

  

### US-5.1 — Add a catalogue semester

  

#### Scenario: User creates a new semester

*   **Given** I am signed in on the dashboard

*   **When** I click **+ New semester**

*   **And** I enter semester name `Fall 2026`

*   **And** I enter start date `2026-8-14`

*   **And** I enter end date `2026-12-11`

*   **Then** the API returns `201` with an semester object containing `id`, `name`, `startDate`, `endDate`, and `userId`

*   **And** `Fall 2026` appears in the semesters view

*   **And** the add-semester dialog closes

  

#### Scenario: User creates a semester with an empty name

*   **Given** I am signed in on the dashboard

*   **When** I open the new semester dialog

*   **And** I leave the name field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester name is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an semester with an empty start date

*   **Given** I am signed in on the dashboard

*   **When** I open the new semester dialog

*   **And** I leave the unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester start date is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an semester with an empty end date unit

*   **Given** I am signed in on the dashboard

*   **When** I open the new semester dialog

*   **And** I leave the price per unit field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester end date is required."**

*   **And** no API request is sent

  

#### Scenario: User creates an semester with a name that is too long

*   **Given** I am signed in on the dashboard

*   **When** I submit an semester name longer than 11 characters

*   **Then** the API returns `400` with `{ "message": "semester name must be 11 characters or fewer." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

---

  

### US-5.2 — Browse the semester list

  

#### Scenario: User views existing semesters

*   **Given** I am signed in on the dashboard as an authorized user

*   **When** I open the semesters list

*   **Then** semesters are displayed in alphabetical order

  

#### Scenario: There are no existing semesters

*   **Given** I am signed in on the dashboard

*   **When** I open the semesters list

*   **Then** no semesters should be displayed

  

### US-5.3 — Correct an semester's start date or end date

  

#### Scenario: User edits an semester's information

*   **Given** I am signed in on the dashboard

*   **When** I click **Edit semester** on an existing semester

*   **And** I change any of the original values

*   **And** I confirm the dialog

*   **Then** the API returns `200` with `{ "message": "semester was updated successfully." }`

*   **And** the semester is visible with updated information in the semesters view

*   **And** the edit-semester dialog closes

  

#### Scenario: User edits an semester with an empty name

*   **Given** I am signed in on the dashboard

*   **When** I open the edit semester dialog

*   **And** I leave the name field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester name is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an semester with an empty start date

*   **Given** I am signed in on the dashboard

*   **When** I open the edit semester dialog

*   **And** I leave the start date field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester start date is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an semester with an empty end date

*   **Given** I am signed in on the dashboard

*   **When** I open the edit semester dialog

*   **And** I leave the end date field empty or whitespace only

*   **And** I attempt to confirm

*   **Then** inline validation blocks the request

*   **And** I see the message **"semester end date is required."**

*   **And** no API request is sent

  

#### Scenario: User edits an semester with a name that is too long

*   **Given** I am signed in on the dashboard

*   **When** I submit an semester name longer than 11 characters

*   **Then** the API returns `400` with `{ "message": "semester name must be 11 characters or fewer." }`

*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits an semester with a non-chronological start date

*   **Given** I am signed in on the dashboard

*   **When** I submit a semester start date that is not a valid date

*   **Then** the API returns `400` with `{ "message": "semester start date must be a chronological date value." }`

*   **And** the error is displayed in a `<v-alert type="error">`



#### Scenario: User edits an semester with a non-chronological end date

*   **Given** I am signed in on the dashboard

*   **When** I submit a semester end date that is not a number

*   **Then** the API returns `400` with `{ "message": "semester start date must be a chronological date value." }`

*   **And** the error is displayed in a `<v-alert type="error">`
  


### US-5.4 Remove an semester

  

#### Scenario: User removes an semester

*   **Given** I am signed in

*   **And** there exists a semester named `Fall 2026`

*   **When** I click the delete icon on the `Fall 2026` row

*   **And** I confirm the delete dialog

*   **Then** the API returns `200` or `204`

*   **And** the semester is removed from the semesters view

  

---

  

## Data Model Requirements

  

### `semesters` table

| Field | Type | Rules |

|-------|------|-------|

| `id` | INTEGER | PK, auto-increment |

| `userId` | INTEGER | Required, FK → `users.id`, `ON DELETE CASCADE` |

| `name` | STRING(11) | Required; unique per (`userId`, `name`); stored and displayed as typed |

| `startDate` | DATE(100) | Required; stored and displayed as typed |

| `endDate` | DATE(100) | Required; stored and displayed as typed |

| `createdAt` | DATE | Sequelize timestamp |

| `updatedAt` | DATE | Sequelize timestamp |

  

### Associations

  

| Association | Rule |

|-------------|------|

| `User` hasMany `semester` | `foreignKey` `userId` required; `ON DELETE CASCADE` |

| `semester` belongsTo `User` | `userId` set from `req.user.id` on create — never from the client body |

| Unique | Composite unique (`userId`, `name`) as specified in the table above |

  

JSON property names match these columns (`name`, `startDate`, `endDate`, `userId`). Sequelize may also return `createdAt` / `updatedAt`; Gherkin does not require the client to display them.

  

  

---

  

## Data Ownership & Isolation

  

Each user owns their catalogue `semesters` exclusively. List, create, update, and delete are scoped to the signed-in user (Feature 1 session). Feature 4 owns the catalogue entity; this feature enforces the same owner isolation on the shared `/courses/semesters` resource.

  

| Rule | Requirement |

|------|-------------|

| **Read scope** | `GET /courses/semesters` returns only rows where `userId = req.user.id`, ordered by `name` ASC (**FR-007**) |

| **Write scope** | `PUT` / `DELETE /courses/semesters/:id` succeed only when the row matches `id` **and** `userId = req.user.id` |

| **Create scope** | `POST /courses/semesters` sets `userId` from `req.user.id`; ignore any client-supplied `userId` |

| **Cross-user access** | Another user’s semester (or unknown `id`) → `404` with `{ "message": "…" }` (not `403`) |

| **UI scope** | `semesterList.vue` renders only the array returned for the signed-in user; do not mix in other users’ rows |

| **Implementation** | Shared owner lookup in `backend/app/authorization/` (for example `getAccessiblesemesterOrNull`); do not copy `userId` filters by hand in every controller action |

  

Unauthenticated requests to these endpoints → `401`.

  

---

  

## API Requirements

  

Mount prefix is `/courses` (existing `semester.routes.js`). Paths and JSON fields match the running course app (`name`, `startDate`, `endDate`). Auth is **Yes** on every row this feature uses (**FR-003**). Do not add query filters, extra fields, or a `{ success, data }` envelope.

  

| Method | Endpoint | Auth | Purpose |

|--------|----------|------|---------|

| `GET` | `/courses/semesters` | Yes | List the caller’s semesters, `name` ASC |

| `POST` | `/courses/semesters` | Yes | Create a semester owned by the caller |

| `PUT` | `/courses/semesters/:id` | Yes | Update a semester |

| `DELETE` | `/courses/semesters/:id` | Yes | Delete a semester |

  

Trailing slashes already present on some Express routes are equivalent to the paths above.

  

**Create request body:**

```json

{

  "name": "Fall 2026",

  "startDate": "2026-8-14",

  "endDate": "2026-12-11"

}

```

  

**Create success** (`201`):

```json

{

  "name": "Fall 2026",

  "startDate": "2026-8-14",

  "endDate": "2026-12-11"
  
  "userId": 42

}

```

  

`name`, `startDate`, and `endDate` are stored and returned as typed.

  

**Update request body:** same three fields (`name`, `startDate`, `endDate`).

  

**Update success** (`200`):

```json

{ "message": "semester was updated successfully." }

```

  

**Delete success:** `200` or `204` (Gherkin allows either). A `200` body may include a message; clients must treat either status as success.

  

**List success** (`200`): JSON array of semester objects (same fields as create). Empty catalogue → `[]`.

  

**Inline-blocked create/edit** (empty or whitespace-only name, start date, or end date): the UI does not send a request. If the API is called anyway, respond `400`.

  

**Quoted validation errors** (`400`): `{ "message": "…" }` with the Gherkin strings:

  

| Condition | `message` |

|-----------|-----------|

| Name longer than 11 characters | `semester name must be 11 characters or fewer.` |

| `startDate` is not a valid date | `semester start date must be a valid date.` |

| `endDate` is not a valid date | `semester end date must be a valid date.` |

  

**Other errors:** `{ "message": "Human-readable explanation." }`  

**Not found / not owned:** `404` (do not use `403`).  

**Invalid `semesterId`:** `400` (Edge Cases).  

**Unauthenticated:** `401`.

  

`GET /courses/semesters/:id` and `DELETE /courses/semesters` (delete-all) exist in the starter routes; this feature does not specify or test them.

  

---

  

## Screen Requirements

  

### [View: semesters] — route name `semesters` (`/semesters`)

  

Existing view: `frontend/src/views/semesterList.vue`. Client calls: `frontend/src/services/semesterServices.js` (`GET`/`POST`/`PUT`/`DELETE` `semesters`). Align labels and validation with Gherkin; keep this route, view, and service.

  

*   Heading: **semesters**

*   Purpose: signed-in user creates, lists reverse chronologically, edits, and deletes the semesters on this one screen (**SC-002**)

*   Primary action: **+ New semester** (`oc-cta`) — opens the add dialog (US-5.1)

*   Table columns: **Name**, **Start Date**, **End Date**, plus row actions

*   Rows show `name`, `startDate`, and `endDate` as stored (unit is a text field, not a fixed unit list)

*   Row action **Edit semester** — opens the edit dialog with that row’s values (US-5.3)

*   Row action: delete icon — opens a confirm-delete dialog (US-5.4). Icon-only control needs an accessible name (for example `aria-label="Delete semester"`)

*   **Empty state:** no semester rows (US-5.2 “User has no existing semesters”)

*   **Loading:** in-progress list request (`:loading` or equivalent); do not treat loading as an empty catalogue

*   **Error:** API failures and quoted `400` messages in `<v-alert type="error">` (Gherkin)

  

**Add dialog**

*   Opened by **+ New semester**

*   Fields: name, start date, and end date (all required — **FR-001**)

*   Confirm creates via `POST`; on `201` the dialog closes and `Fall 2026` (or the typed name) appears in the table

*   Cancel / dismiss closes without a request

  

**Edit dialog**

*   Opened by **Edit semester**

*   Same three fields, prefilled (**FR-004**)

*   Confirm updates via `PUT`; on `200` the dialog closes and the table shows the new values (**FR-005**)

  

**Delete dialog**

*   Opened from the row delete icon

*   Confirm calls `DELETE`; on `200` or `204` the row is gone (**FR-006**)

  

**Inline validation** (no API request) — exact copy from Gherkin:

  

| Field empty or whitespace | Message |

|---------------------------|---------|

| Name | `semester name is required.` |

| Start date | `semester start date is required.` |

| End date | `semester end date is required.` |

  

**App chrome**

*   `MenuBar` already has **semesters** (`:to="{ name: 'semesters' }"`) when a user is signed in — keep it. Gherkin “open the semesters menu” is this control.

*   This feature does not add or change Login / courses / profile chrome.

  

---

  

## Test Coverage Map

  

Each scenario above must map to at least one automated test. Story IDs follow the Gherkin headings in this file (`### US-5.n`). `it("…")` titles must match the **Scenario** column exactly.

  

If another Feature already added the same scenario titles in these files, extend those files — do not duplicate `it` names.

  

| Story | Scenario | Test file | Test name |

|-------|----------|-----------|-----------|

| US-5.1 | User creates a new semester | `backend/tests/semesters.test.js` | `User creates a new semester` |

| US-5.1 | User creates a new semester | `frontend/tests/semesterList.test.js` | `User creates a new semester` |

| US-5.1 | User creates an semester with an empty name | `frontend/tests/semesterList.test.js` | `User creates an semester with an empty name` |

| US-5.1 | User creates an semester with an start date | `frontend/tests/semesterList.test.js` | `User creates an semester with an start date` |

| US-5.1 | User creates an semester with an empty end date | `frontend/tests/semesterList.test.js` | `User creates an semester with an empty end date` |

| US-5.1 | User creates an semester with a name that is too long | `backend/tests/semesters.test.js` | `User creates an semester with a name that is too long` |

| US-5.1 | User creates an semester with a name that is too long | `frontend/tests/semesterList.test.js` | `User creates an semester with a name that is too long` |

| US-5.1 | User creates an semester with a non-date start date | `backend/tests/semesters.test.js` | `User creates an semester with a non-date start date` |

| US-5.1 | User creates an semester with a non-date start date | `frontend/tests/semesterList.test.js` | `User creates an semester with a non-date start date` |

| US-5.2 | User views existing semesters | `backend/tests/semesters.test.js` | `User views existing semesters` |

| US-5.2 | User views existing semesters | `frontend/tests/semesterList.test.js` | `User views existing semesters` |

| US-5.2 | User has no existing semesters | `backend/tests/semesters.test.js` | `User has no existing semesters` |

| US-5.2 | User has no existing semesters | `frontend/tests/semesterList.test.js` | `User has no existing semesters` |

| US-5.3 | User edits an semester's information | `backend/tests/semesters.test.js` | `User edits an semester's information` |

| US-5.3 | User edits an semester's information | `frontend/tests/semesterList.test.js` | `User edits an semester's information` |

| US-5.3 | User edits an semester with an empty name | `frontend/tests/semesterList.test.js` | `User edits an semester with an empty name` |

| US-5.3 | User edits an semester with an empty start date | `frontend/tests/semesterList.test.js` | `User edits an semester with an empty start date` |

| US-5.3 | User edits an semester with an empty end date | `frontend/tests/semesterList.test.js` | `User edits an semester with an empty end date` |

| US-5.3 | User edits an semester with a name that is too long | `backend/tests/semesters.test.js` | `User edits an semester with a name that is too long` |

| US-5.3 | User edits an semester with a name that is too long | `frontend/tests/semesterList.test.js` | `User edits an semester with a name that is too long` |

| US-5.3 | User edits an semester with a non-date start date | `backend/tests/semesters.test.js` | `User edits an semester with a non-date start date` |

| US-5.3 | User edits an semester with a non-date start date | `frontend/tests/semesterList.test.js` | `User edits an semester with a non-date start date` |

| US-5.3 | User edits an semester with a non-date end date | `backend/tests/semesters.test.js` | `User edits an semester with a non-date end date` |

| US-5.3 | User edits an semester with a non-date end date | `frontend/tests/semesterList.test.js` | `User edits an semester with a non-date end date` |

| US-5.4 | User removes an semester | `backend/tests/semesters.test.js` | `User removes an semester` |

| US-5.4 | User removes an semester | `frontend/tests/semesterList.test.js` | `User removes an semester` |

  
  

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

*   Attaching semesters to courses, course steps, or `coursesemester` quantity/unit on a course ([later course features](./feature-list.md))

*   `GET /courses/semesters/:id` and `DELETE /courses/semesters` (delete-all) — starter routes; not in this feature’s Gherkin

*   Profile / log out ([Feature 6](./feature-list.md))

*   course PDF export, published-course browsing, and any other capability not in **FR-001**–**FR-007**

*   Multi-user sharing of a catalogue, admin override, or i18n
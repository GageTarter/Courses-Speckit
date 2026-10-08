# Feature: Ingredients Management

**Feature ID:** 5
**Branch pattern:** `feature/5-ingredients-management`
**Status:** Ready
**Created:** 2026-09-17
**Input:** Ingredients created and managed by the user currently signed in
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md) [Feature 4 — Ingredient Catalogue Management](feature-4-ingredient-catalogue-management.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-5.1: View created ingredients
**As a** Authorized User  
**I want to** view the list of created ingredients  
**So that** I can keep track of which ingredients the software knows about

**Priority:** P1  
**Independent test:** Display all created ingredients  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2 Edit existing ingredients 
**As a** Authorized User  
**I want to** be able to edit the values of any created ingredient  
**So that** I can change the values, such as units of measurement and price per unit, of any created ingredient to be different than what was inputted on creation

**Priority:** P1  
**Independent test:** Edit the existing ingredients  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3 Delete existing ingredients
**As a** Authorized User  
**I want to** delete any of the existing ingredient s 
**So that** I can no longer see or include them in recipes

**Priority:** P1  
**Independent test:** Delete any existing ingredient and clear its data  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** User must fill all fields, including the name, unit of measurement, and price per unit.
-- **FR-002:** Created ingredients must be stored for each user so that they can view and manage them whenever they are signed in.
-- **FR-003:** Created ingredients must be accessible only by the user who created them.
-- **FR-004:** User must fill all fields when making edits to an existing ingredient.
-- **FR-005:** Edited information must be updated in the affected ingredient when a user makes a change.
-- **FR-006:** Ingredient must be completely erased when the delete option is selected by the user.
-- **FR-007:** Created ingredients must be listed in alphabetical order.

---

## Assumptions

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.
- Feature 4 ingredient catalogue management MUST be merged to 'dev' before implementing this feature.

## Edge Cases
- Empty or whitespace-only ingredient data fields → `400`.
- Name or unit longer than 100 characters → `400`.
- `pricePerUnit` that is not a number → `400`.
- Invalid `ingredientId` → `400`.

## Success Criteria
- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Signed-in user can create, view, edit, and delete ingredients on one screen without being able to access other users' private recipes and ingredients.
- **SC-003**: `npm test` passes for ingredient API and dashboard ingredients-view behavior.

---

## Key Entities

-- **Ingredient** named group belonging to one user (from Feature 4).
-- **User** owns many ingredients (from Feature 1).

---

## Acceptance Criteria (Gherkin)

### US-5.1 — Add a catalogue ingredient

#### Scenario: User creates a new ingredient
*   **Given** I am signed in on the dashboard
*   **When** I click **+ New Ingredient**
*   **And** I enter ingredient name `Butter`
*   **And** I enter unit `sticks`
*   **And** I enter price per unit `1.50`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with an ingredient object containing `id`, `name`, `unit`, `pricePerUnit`, and `userId`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** `Butter` appears in the ingredients view
*   **And** the add-ingredient dialog closes

#### Scenario: User creates an ingredient with an empty name
*   **Given** I am signed in on the dashboard
*   **When** I open the new ingredient dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient name is required."**
*   **And** no API request is sent

#### Scenario: User creates an ingredient with an empty unit
*   **Given** I am signed in on the dashboard
*   **When** I open the new ingredient dialog
*   **And** I leave the unit field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient unit is required."**
*   **And** no API request is sent

#### Scenario: User creates an ingredient with an empty price per unit
*   **Given** I am signed in on the dashboard
*   **When** I open the new ingredient dialog
*   **And** I leave the price per unit field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient price per unit is required."**
*   **And** no API request is sent

#### Scenario: User creates an ingredient with a name that is too long
*   **Given** I am signed in on the dashboard
*   **When** I submit an ingredient name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Ingredient name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates an ingredient with a non-numeric price per unit
*   **Given** I am signed in on the dashboard
*   **When** I submit an ingredient price per unit that is not a number
*   **Then** the API returns `400` with `{ "message": "Ingredient price per unit must be a number." }`
*   **And** the error is displayed in a `<v-alert type="error">`

---

### US-5.2 — Browse the Ingredient Catalogue

#### Scenario: User views existing ingredients
*   **Given** I am signed in on the dashboard
*   **When** I open the ingredients menu
*   **Then** ingredients created by me are displayed in alphabetical order

#### Scenario: User has no existing ingredients
*   **Given** I am signed in on the dashboard
*   **When** I open the ingredients menu
*   **Then** no ingredients should be displayed

### US-5.3 — Correct an ingredient's unit or price

#### Scenario: User edits an ingredient's information
*   **Given** I am signed in on the dashboard
*   **When** I click **Edit Ingredient** on an existing ingredient
*   **And** I change any of the original values
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "Ingredient was updated successfully." }`
*   **And** the ingredient is visible with updated information in the ingredients view
*   **And** the edit-ingredient dialog closes

#### Scenario: User edits an ingredient with an empty name
*   **Given** I am signed in on the dashboard
*   **When** I open the edit ingredient dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient name is required."**
*   **And** no API request is sent

#### Scenario: User edits an ingredient with an empty unit
*   **Given** I am signed in on the dashboard
*   **When** I open the edit ingredient dialog
*   **And** I leave the unit field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient unit is required."**
*   **And** no API request is sent

#### Scenario: User edits an ingredient with an empty price per unit
*   **Given** I am signed in on the dashboard
*   **When** I open the edit ingredient dialog
*   **And** I leave the price per unit field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Ingredient price per unit is required."**
*   **And** no API request is sent

#### Scenario: User edits an ingredient with a name that is too long
*   **Given** I am signed in on the dashboard
*   **When** I submit an ingredient name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Ingredient name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits an ingredient with a non-numeric price per unit
*   **Given** I am signed in on the dashboard
*   **When** I submit an ingredient price per unit that is not a number
*   **Then** the API returns `400` with `{ "message": "Ingredient price per unit must be a number." }`
*   **And** the error is displayed in a `<v-alert type="error">`

### US-5.4 Remove an ingredient

#### Scenario: User removes an ingredient
*   **Given** I am signed in
*   **And** I own an ingredient named `Butter`
*   **When** I click the delete icon on the `Butter` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the ingredient is removed from the ingredients view

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

*   Heading: **Ingredients**
*   Purpose: signed-in user creates, lists (A–Z), edits, and deletes their catalogue ingredients on this one screen (**SC-002**)
*   Primary action: **+ New Ingredient** (`oc-cta`) — opens the add dialog (US-5.1)
*   Table columns: **Name**, **Unit**, **Price Per Unit**, plus row actions
*   Rows show `name`, `unit`, and `pricePerUnit` as stored (unit is a text field, not a fixed unit list)
*   Row action **Edit Ingredient** — opens the edit dialog with that row’s values (US-5.3)
*   Row action: delete icon — opens a confirm-delete dialog (US-5.4). Icon-only control needs an accessible name (for example `aria-label="Delete ingredient"`)
*   **Empty state:** no ingredient rows (US-5.2 “User has no existing ingredients”)
*   **Loading:** in-progress list request (`:loading` or equivalent); do not treat loading as an empty catalogue
*   **Error:** API failures and quoted `400` messages in `<v-alert type="error">` (Gherkin)

**Add dialog**
*   Opened by **+ New Ingredient**
*   Fields: name, unit, price per unit (all required — **FR-001**)
*   Confirm creates via `POST`; on `201` the dialog closes and `Butter` (or the typed name) appears in the table
*   Cancel / dismiss closes without a request

**Edit dialog**
*   Opened by **Edit Ingredient**
*   Same three fields, prefilled (**FR-004**)
*   Confirm updates via `PUT`; on `200` the dialog closes and the table shows the new values (**FR-005**)

**Delete dialog**
*   Opened from the row delete icon
*   Confirm calls `DELETE`; on `200` or `204` the row is gone (**FR-006**)

**Inline validation** (no API request) — exact copy from Gherkin:

| Field empty or whitespace | Message |
|---------------------------|---------|
| Name | `Ingredient name is required.` |
| Unit | `Ingredient unit is required.` |
| Price per unit | `Ingredient price per unit is required.` |

**App chrome**
*   `MenuBar` already has **Ingredients** (`:to="{ name: 'ingredients' }"`) when a user is signed in — keep it. Gherkin “open the ingredients menu” is this control.
*   This feature does not add or change Login / Recipes / profile chrome.

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

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-007** satisfied)
*   [ ] **Success Criteria (SC-001**–**SC-003)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Sign-in, registration, and session issuance ([Feature 1](./feature-1-user-authentification.md))
*   Defining the ingredient catalogue entity if Feature 4 already shipped it ([Feature 4](./feature-4-ingredient-catalogue-management.md)) — this feature consumes that entity on the existing Ingredients screen. Create/browse/edit/delete Gherkin titles are shared with Feature 4; keep one `it()` per title in `ingredients.test.js` / `IngredientList.test.js`.
*   Attaching ingredients to recipes, recipe steps, or `recipeIngredient` quantity/unit on a recipe ([later recipe features](./feature-list.md))
*   `GET /recipeapi/ingredients/:id` and `DELETE /recipeapi/ingredients` (delete-all) — starter routes; not in this feature’s Gherkin
*   Profile / log out ([Feature 6](./feature-list.md))
*   Recipe PDF export, published-recipe browsing, and any other capability not in **FR-001**–**FR-007**
*   Multi-user sharing of a catalogue, admin override, or i18n

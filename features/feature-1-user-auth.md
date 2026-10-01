# Feature: User Authentication

**Feature ID:** 1
**Branch pattern:** `feature/1-user-auth`
**Status:** Draft
**Created:** 2026-10-01
**Input:** Students register themselves and sign in; admins sign in with elevated rights, so the course catalog and enrollment screens can tell the two roles apart
**Related:** [ADR-0001 — Client–server multi-user architecture](../docs/adr/0001-client-server-multi-user-architecture.md), [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md)

---

## User Stories

### US-1.1: Register as a student
**As a** prospective student
**I want to** create my own account with my name, email, username, and password
**So that** I can sign in and enroll in sections without an administrator creating my account

**Priority:** P1
**Independent test:** Submit valid registration and land on the protected home page with `user` in `localStorage` and `role` of `student`
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in
**As a** registered student or admin
**I want to** sign in with my username and password
**So that** I can access the screens my role allows

**Priority:** P1
**Independent test:** Sign in with known credentials and receive a session token plus redirect to home
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads
**As a** signed-in user
**I want** my session to persist in the browser
**So that** refreshing the page does not force me to sign in again

**Priority:** P1
**Independent test:** Refresh a protected route with a valid `localStorage` session — no re-login
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out
**As a** signed-in user
**I want to** sign out
**So that** no one else can use my account on a shared lab machine

**Priority:** P2
**Independent test:** Sign out clears the server session and `localStorage`; user lands on login
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Block unauthenticated access
**As the** application
**I want to** require a valid session for every non-auth screen and API route
**So that** catalog and enrollment data is never served to anonymous callers

**Priority:** P1
**Independent test:** Navigate to a protected route without a session → redirect to login; API without token → `401`
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

### US-1.6: Distinguish admins from students
**As the** application
**I want to** carry a role on every session and expose a reusable admin guard
**So that** Features 2, 3, and 5 can restrict semester, course, and section management to admins

**Priority:** P1
**Independent test:** Call a route wrapped in `requireAdmin` as a student → `403`; as an admin → `200`
**Acceptance scenarios:** see ### US-1.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Users MUST authenticate with **username** + **password** (not email-only login).
- **FR-002**: Registration MUST collect first name, last name, email, username, and password.
- **FR-003**: Passwords MUST be hashed with **bcrypt** (`SALT_ROUNDS = 10`) before persistence; hashes MUST never be returned by the API.
- **FR-004**: Sessions MUST use a **JWT + Session table** pattern: the token is stored server-side and the client sends `Authorization: Bearer <token>`.
- **FR-005**: Session lifetime MUST be **24 hours** from creation.
- **FR-006**: Login MUST reuse a non-expired session for the same user when one already exists.
- **FR-007**: Self-registration MUST always assign role `student`. The registration endpoint MUST ignore any `role` supplied in the request body, so an account cannot escalate its own privileges.
- **FR-008**: Admin accounts MUST be created by an operator-run seed script in `backend/app/scripts/`, never through a public endpoint.
- **FR-009**: Every authenticated request MUST resolve to exactly one user via `req.user.id` from the session token, and MUST expose `req.user.role` (foundation for Features 2, 3, 5, and 6).
- **FR-010**: The backend MUST export a reusable `requireAdmin` middleware from `backend/app/authorization/authorization.js` that rejects non-admin callers with `403`.
- **FR-011**: The login response MUST include `role` so the frontend can show or hide admin navigation.
- **FR-012**: Usernames MUST be normalized with `trim().toLowerCase()` on both registration and login, so `JDoe` and `jdoe` are the same account.
- **FR-013**: Registration MUST use shared `emailRules` from `frontend/src/config/validation.js` — required plus regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); invalid format message: **"Enter a valid email address."**

---

## Assumptions

- Greenfield app — no existing users and no external identity provider.
- A single browser `localStorage` session per device; no multi-tab sync beyond shared storage.
- Semesters, courses, sections, and enrollment are deferred to Features 2, 3, 5, and 6. Feature 1 delivers authentication plus a minimal protected home placeholder only.
- Faculty are a later concern; this feature ships exactly two roles, `student` and `admin`.

## Edge Cases

- Duplicate username or email on register → `400` with a clear message.
- Invalid login credentials → `401` with the same message for a wrong username as for a wrong password, so the response does not reveal which accounts exist.
- Missing or expired token on a protected API → `401`; the frontend clears the session and redirects to login.
- Whitespace-only required fields → rejected on the client and the server.
- A request body containing `"role": "admin"` on registration → account is still created as `student`.
- A student calling an admin-guarded route → `403` (role guard), which is distinct from the `404` used for another user's row.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A new student can register, sign in, reach the protected home page, and sign out in one manual pass.
- **SC-003**: A seeded admin can sign in and receive `role: "admin"` in the login payload.
- **SC-004**: `npm test` passes with backend auth coverage and frontend router, register, and login coverage.

---

## Data Ownership & Isolation (foundation)

Feature 1 establishes identity and role; Features 2, 3, 5, and 6 enforce the data boundaries built on it.

| Rule | Requirement |
|------|-------------|
| **Identity** | Every authenticated request resolves to one user through the Session row; `req.user = { id, role }` |
| **Role source** | Role comes from the joined `users` row, never from the request body or a client header |
| **Self-service writes** | Registration creates only `student` accounts |
| **Cross-user rows** | No endpoint in this feature returns another user's profile or session |
| **Role guard vs ownership** | Admin-only *collections* → `403` via `requireAdmin`. Another user's *row* → `404` (do not confirm existence). Later features follow this split. |
| **Implementation** | `authenticate` and `requireAdmin` live in `backend/app/authorization/authorization.js` — controllers must not re-implement either check |

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/courses/register` | No | Create a new student account |
| `POST` | `/courses/login` | Yes* | Authenticate and return the session payload |
| `POST` | `/courses/logout` | Yes | Invalidate the current session token |

\* `login` takes credentials rather than a Bearer token.

**Register request body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "secret123"
}
```

**Login / register success response** (flat JSON, no envelope):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jane@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "student",
  "token": "<jwt>"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with the appropriate HTTP status.

| Status | Used for |
|--------|----------|
| `201` | Registration succeeded |
| `200` | Login and logout succeeded |
| `400` | Validation failure, duplicate username, duplicate email |
| `401` | Invalid credentials, missing token, expired token |
| `403` | Authenticated but role is not `admin` on a `requireAdmin` route |

---

## Screen Requirements

### [View: Login Page] — route name `login`
*   Full-screen auth layout (no `MenuBar`).
*   Fields: username, password.
*   Primary action: **Sign in** — `<v-btn color="primary" variant="elevated" class="oc-cta" :loading="loading">`.
*   Link to the registration page labelled **Create an account**.
*   Failed login renders `<v-alert type="error" density="compact">` with the server message.

### [View: Register Page] — route name `register`
*   Full-screen auth layout (no `MenuBar`).
*   Fields: first name, last name, email, username, password, confirm password.
*   No role selector — accounts are always created as students (FR-007).
*   Email field uses shared `emailRules` from `frontend/src/config/validation.js`.
*   Primary action: **Create account** (`oc-cta`).
*   Link to the login page labelled **Already have an account?**
*   Client-side validation runs before the API call; server errors render in `<v-alert type="error">`.

### [View: Home placeholder] — route name `home`
*   Minimal protected landing page shown after a successful sign-in.
*   Displays a welcome message using the user's first name.
*   Displays the signed-in role as a `<v-chip>` so the admin/student distinction is demonstrable before Features 2–6 add real screens.
*   **Sign out** button on this page (standalone `v-btn`; moves into `MenuBar` when a later feature introduces app chrome).
*   **No `MenuBar`** anywhere in Feature 1 — auth pages and this placeholder use a full-screen layout only.

**Router guard:** `router.beforeEach` redirects to `login` when no `user` is in storage and the target route is not `login` or `register`; it redirects an already-signed-in user away from `login` to `home`.

---

## Key Entities

- **User**: a registered account with a name, email, username, and role of `student` or `admin`. A student owns future enrollments; an admin manages the catalog.
- **Session**: a server-side record tying a JWT token to a user; expires 24 hours after creation.

---

## Data Model Requirements

### `users` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded via `defaultScope` |
| `role` | STRING(20) | Required; `student` or `admin`; defaults to `student` |

### `sessions` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required |
| `userId` | INTEGER FK | Required, references `users.id` |

### Associations
*   `User hasMany Session`
*   `Session belongsTo User`

Associations are wired in `backend/app/models/index.js`, not in controllers.

---

## Acceptance Criteria (Gherkin)

### US-1.1 — Register as a student

#### Scenario: Student registers with valid information
*   **Given** I am on the registration page
*   **When** I enter a valid first name, last name, email, username, password, and matching confirm password
*   **And** I submit the form
*   **Then** the API returns `201` with a payload including `userId`, `username`, `email`, `token`, and `role`
*   **And** the returned `role` is `student`
*   **And** my user record is stored with a bcrypt password hash
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: Registration ignores a role supplied in the request body
*   **Given** no user exists with username `sneaky`
*   **When** I POST a registration body containing `"username": "sneaky"` and `"role": "admin"`
*   **Then** the API returns `201`
*   **And** the returned `role` is `student`
*   **And** the stored user record has role `student`

#### Scenario: User submits registration with missing email
*   **Given** I am on the registration page
*   **When** I leave the email field empty
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Email is required."**
*   **And** no API request is sent

#### Scenario: User submits registration with invalid email format
*   **Given** I am on the registration page
*   **When** I enter a value that is not a valid email address (e.g. `notanemail`)
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Enter a valid email address."**
*   **And** no API request is sent

#### Scenario: User submits registration with password too short
*   **Given** I am on the registration page
*   **When** I enter a password with fewer than 8 characters
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Password must be at least 8 characters."**

#### Scenario: User submits registration with mismatched passwords
*   **Given** I am on the registration page
*   **When** password and confirm password do not match
*   **And** I submit the form
*   **Then** inline validation blocks the request
*   **And** I see the message **"Passwords do not match."**

#### Scenario: User registers with a duplicate username
*   **Given** a user with username `jdoe` already exists
*   **When** I submit registration with username `JDoe`
*   **Then** the API returns `400` with `{ "message": "Username is already taken." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User registers with a duplicate email
*   **Given** a user with email `jane@example.com` already exists
*   **When** I submit registration with email `jane@example.com`
*   **Then** the API returns `400` with `{ "message": "Email is already registered." }`
*   **And** the error is displayed in a `<v-alert type="error">`

---

### US-1.2 — Sign in

#### Scenario: User signs in with valid credentials
*   **Given** I am on the login page
*   **And** a registered user exists with username `jdoe` and a known password
*   **When** I enter username `jdoe` and the correct password
*   **And** I click **Sign in**
*   **Then** the API returns `200` with a payload containing `userId`, `username`, `token`, and `role`
*   **And** a session row is created or reused in the database
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: User signs in with invalid password
*   **Given** a registered user exists with username `jdoe`
*   **When** I enter username `jdoe` and an incorrect password
*   **And** I click **Sign in**
*   **Then** the API returns `401` with `{ "message": "Invalid username or password." }`
*   **And** I remain on the login page
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: Unknown username returns the same error as a wrong password
*   **Given** no user exists with username `ghost`
*   **When** I submit a login for username `ghost` with any password
*   **Then** the API returns `401` with `{ "message": "Invalid username or password." }`

#### Scenario: Username is case-insensitive at sign in
*   **Given** a registered user exists with username `jdoe`
*   **When** I sign in with username `JDoe` and the correct password
*   **Then** the API returns `200`
*   **And** the returned `username` is `jdoe`

#### Scenario: User signs in with missing username
*   **Given** I am on the login page
*   **When** I leave the username field empty
*   **And** I click **Sign in**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Username is required."**
*   **And** no API request is sent

#### Scenario: User signs in with missing password
*   **Given** I am on the login page
*   **When** I leave the password field empty
*   **And** I click **Sign in**
*   **Then** inline validation blocks the request
*   **And** I see the message **"Password is required."**
*   **And** no API request is sent

---

### US-1.3 — Stay signed in across page loads

#### Scenario: Signed-in user visits login page
*   **Given** I have a valid session in `localStorage`
*   **When** I navigate to the login page
*   **Then** I am redirected to the home page

#### Scenario: API request includes session token
*   **Given** I am signed in
*   **When** the frontend makes an authenticated API request
*   **Then** the request includes header `Authorization: Bearer <token>`

#### Scenario: Expired or invalid session token
*   **Given** I am signed in with an expired or revoked token
*   **When** the frontend makes an authenticated API request
*   **Then** the API returns `401` with an unauthorized message
*   **And** `localStorage` key `user` is cleared
*   **And** I am redirected to the login page

---

### US-1.4 — Sign out

#### Scenario: User signs out
*   **Given** I am signed in on the home page
*   **When** I click **Sign out**
*   **Then** the API invalidates my session token on the server
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

#### Scenario: Reusing a token after sign out fails
*   **Given** I have signed out
*   **When** I replay my previous Bearer token against a protected route
*   **Then** the API returns `401`

---

### US-1.5 — Block unauthenticated access

#### Scenario: Unauthenticated user accesses a protected route
*   **Given** I have no session in `localStorage`
*   **When** I navigate directly to the home page
*   **Then** I am redirected to the login page

#### Scenario: Protected API request without a token
*   **Given** I have no session token
*   **When** I send a request to a route wrapped in `authenticate`
*   **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

---

### US-1.6 — Distinguish admins from students

#### Scenario: Seeded admin signs in and receives the admin role
*   **Given** an admin account has been created by the seed script
*   **When** the admin signs in with valid credentials
*   **Then** the API returns `200`
*   **And** the returned `role` is `admin`

#### Scenario: Student is rejected by the admin guard
*   **Given** I am signed in as a student
*   **When** I send a request to a route wrapped in `requireAdmin`
*   **Then** the API returns `403` with `{ "message": "Forbidden! Admin access required." }`

#### Scenario: Admin passes the admin guard
*   **Given** I am signed in as an admin
*   **When** I send a request to a route wrapped in `requireAdmin`
*   **Then** the request is allowed through to the controller

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-1.1 | Student registers with valid information | `backend/tests/auth.test.js` | `Student registers with valid information` |
| US-1.1 | Registration ignores a role supplied in the request body | `backend/tests/auth.test.js` | `Registration ignores a role supplied in the request body` |
| US-1.1 | User submits registration with missing email | `backend/tests/auth.test.js`, `frontend/tests/Register.test.js` | `User submits registration with missing email` |
| US-1.1 | User submits registration with invalid email format | `frontend/tests/Register.test.js` | `User submits registration with invalid email format` |
| US-1.1 | User submits registration with password too short | `backend/tests/auth.test.js`, `frontend/tests/Register.test.js` | `User submits registration with password too short` |
| US-1.1 | User submits registration with mismatched passwords | `frontend/tests/Register.test.js` | `User submits registration with mismatched passwords` |
| US-1.1 | User registers with a duplicate username | `backend/tests/auth.test.js` | `User registers with a duplicate username` |
| US-1.1 | User registers with a duplicate email | `backend/tests/auth.test.js` | `User registers with a duplicate email` |
| US-1.2 | User signs in with valid credentials | `backend/tests/auth.test.js` | `User signs in with valid credentials` |
| US-1.2 | User signs in with invalid password | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js` | `User signs in with invalid password` |
| US-1.2 | Unknown username returns the same error as a wrong password | `backend/tests/auth.test.js` | `Unknown username returns the same error as a wrong password` |
| US-1.2 | Username is case-insensitive at sign in | `backend/tests/auth.test.js` | `Username is case-insensitive at sign in` |
| US-1.2 | User signs in with missing username | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js` | `User signs in with missing username` |
| US-1.2 | User signs in with missing password | `frontend/tests/Login.test.js` | `User signs in with missing password` |
| US-1.3 | Signed-in user visits login page | `frontend/tests/router.test.js` | `Signed-in user visits login page` |
| US-1.3 | API request includes session token | `backend/tests/authenticate.test.js` | `API request includes session token` |
| US-1.3 | Expired or invalid session token | `backend/tests/authenticate.test.js` | `Expired or invalid session token` |
| US-1.4 | User signs out | `backend/tests/auth.test.js` | `User signs out` |
| US-1.4 | Reusing a token after sign out fails | `backend/tests/auth.test.js` | `Reusing a token after sign out fails` |
| US-1.5 | Unauthenticated user accesses a protected route | `frontend/tests/router.test.js` | `Unauthenticated user accesses a protected route` |
| US-1.5 | Protected API request without a token | `backend/tests/authenticate.test.js` | `Protected API request without a token` |
| US-1.6 | Seeded admin signs in and receives the admin role | `backend/tests/auth.test.js` | `Seeded admin signs in and receives the admin role` |
| US-1.6 | Student is rejected by the admin guard | `backend/tests/authenticate.test.js` | `Student is rejected by the admin guard` |
| US-1.6 | Admin passes the admin guard | `backend/tests/authenticate.test.js` | `Admin passes the admin guard` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-user-auth.md on branch `feature/1-user-auth`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
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

---

## Delivered to later features

*   `authenticate` and `requireAdmin` middleware for Features 2, 3, 5, and 6.
*   `req.user = { id, role }` on every protected request.
*   The `home` placeholder is temporary; the feature that introduces `MenuBar` replaces it and relocates **Sign out**.

---

## Out of Scope

*   Password reset and email verification
*   OAuth / social login
*   Admin-created student and faculty accounts (admin user management)
*   Faculty as a third role
*   Semester management ([Feature 3](./feature-3-semester-management.md))
*   Course management ([Feature 2](./feature-2-course-management.md))
*   Section management ([Feature 5](./feature-5-section-management.md))
*   Section enrollment ([Feature 6](./feature-6-enrollment-management.md))

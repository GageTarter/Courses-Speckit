# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

These files answer: *"What rules does the app enforce right now?"*
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

---

## Identity and roles — [Feature 1](../feature-1-user-auth.md)

| Rule | Enforcement |
|------|-------------|
| Two roles exist: `student` and `admin` | `users.role`, defaulting to `student` |
| Self-registration always creates a student | `auth.controller.js` hardcodes `role: "student"` and ignores any `role` in the body (FR-007) |
| Admins are created out of band | `npm run create-admin --prefix backend -- <username> <password> <email>` (FR-008) |
| Usernames are case-insensitive | Normalized with `trim().toLowerCase()` on register and login (FR-012) |
| Passwords are hashed, never returned | bcrypt `SALT_ROUNDS = 10`; `defaultScope` excludes the column |

## Sessions

| Rule | Enforcement |
|------|-------------|
| Sessions last 24 hours | `expirationDate` set 86400s ahead; JWT `expiresIn` matches |
| A live session is reused rather than duplicated | `issueSession` looks for an unexpired row for the user first |
| Logout invalidates the token | The session row is deleted, so a replayed token fails `authenticate`. This realizes "clear token on Session row" from `auth-patterns.mdc` by removing the row outright |
| The client stores the login payload | `localStorage` key `user`, written through `Utils.setStore` |

## Access control

| Rule | Enforcement |
|------|-------------|
| Protected routes need `Authorization: Bearer <token>` | `authenticate` in `app/authorization/authorization.js` |
| `req.user` is `{ id, role }` from the joined user row | Never read from the request body or a client header |
| Non-admins are refused admin routes with `403` | `requireAdmin` — a role guard, distinct from the ownership rule below |
| Another user's row returns `404`, not `403` | Standing rule from ADR-0002; no owned resources exist yet, so nothing enforces it until Feature 6 |
| A `401` clears the client session | Axios response interceptor removes `user` and routes to login |

## Validation

| Rule | Enforcement |
|------|-------------|
| Registration requires first name, last name, email, username, password | Checked in the controller and mirrored by Vuetify rules in `Register.vue` |
| Email must match the shared regex | `emailRules` in `frontend/src/config/validation.js`; same regex server-side |
| Passwords must be at least 8 characters | Controller and `Register.vue` |
| Confirm password must match | `Register.vue` only — the API never receives it |
| Whitespace-only input counts as empty | Values are trimmed before the required check |
| Login failures never reveal whether an account exists | Unknown username and wrong password both return `Invalid username or password.` |

## UI

| Rule | Enforcement |
|------|-------------|
| Anonymous visitors are redirected to `login` | `router.beforeEach` in `frontend/src/router.js` |
| Signed-in users are redirected away from `login` and `register` | Same guard |
| Client validation blocks submission before any API call | `v-form` `validate()` gates both auth views |
| There is no `MenuBar` yet | `App.vue` renders `router-view` only; **Sign out** lives on the home page until a later feature adds app chrome |
| Home shows the signed-in first name and a role chip | `Home.vue` |
| Students reach enrollment from Home **Section Enrollment**; admins are redirected away from `enroll` | `router.js` + `Home.vue` |

## Enrollment — [Feature 6](../feature-6-enrollment-management.md)

| Rule | Enforcement |
|------|-------------|
| Only the signed-in student owns their enrollments | `userId` from `req.user.id`; `getOwnedEnrollmentOrNull` → `404` |
| Only students may create or drop enrollments | `requireStudent` → `403` |
| One enrollment per section | Unique (`userId`, `sectionId`) plus a `400` before insert |
| One section per course per semester | Controller checks sibling sections |
| Capacity is a hard cap | Count enrollments vs `section.capacity` |
| Seats are not stored | `remainingSeats` on `GET /courses/catalog/sections` |
| Catalog browse for enrollment | `GET /courses/semesters` and `GET /courses/catalog/sections` |

## My Courses — [Feature 7](../feature-7-student-course-listing.md)

| Rule | Enforcement |
|------|-------------|
| A student sees only courses linked to their enrollments | `GET /courses/my-courses` filters `enrollment.userId` to `req.user.id` |
| One row per course | Distinct `course.id` even when several sections are enrolled |
| Sort is course name ascending | Controller sorts after de-duplicating |
| Students only | `requireStudent` → `403` for admins; router `meta.roles` sends admins home from `/my-courses` |
| Empty list copy | **You are not enrolled in any courses.** |
| Menu | **My Courses** is shown for students only; admin **Courses** stays `/courses` |

## My Sections — [Feature 8](../feature-8-student-section-listing.md)

| Rule | Enforcement |
|------|-------------|
| A student sees only sections linked to their enrollments | `GET /courses/my-sections` filters `enrollment.userId` to `req.user.id` |
| One row per section | Two sections of the same course both appear |
| Sort is section id ascending | Controller sorts after de-duplicating |
| Semester is the Feature 3 name | Response `semester` is `semesters.name`, not `semesterOffered` |
| Faculty is the numeric id | Response `facultyId` is `sections.facultyId` |
| Students only | `requireStudent` → `403` for admins; router `meta.roles` sends admins home from `/my-sections` |
| Empty list copy | **You are not enrolled in any sections.** |
| Section number display | The page shows two digits (`01`); the API returns the integer |
| Menu | **My Sections** is shown for students only; admin **Sections** stays `/sections` |

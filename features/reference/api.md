# API Reference

**Current integrated state on `dev`.** Update when endpoints merge.

All routes are mounted under `/courses` (see `backend/server.js`).

## Endpoints

### Authentication — [Feature 1](../feature-1-user-auth.md)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/health` | No | Liveness probe — returns `{ "status": "ok" }` |
| `POST` | `/courses/register` | No | Create a student account and open a session |
| `POST` | `/courses/login` | No | Authenticate and return the session payload |
| `POST` | `/courses/logout` | Yes | Delete the caller's session row |

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

A `role` sent in the register body is ignored; self-registration always produces a `student`.

**Login request body:**
```json
{ "username": "jdoe", "password": "secret123" }
```

**Register (`201`) and login (`200`) response:**
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

**Logout response (`200`):** `{ "message": "Logged out." }`

### Status codes in use

| Status | Meaning |
|--------|---------|
| `400` | Validation failure, duplicate username, duplicate email |
| `401` | Invalid credentials, missing token, invalid token, expired session |
| `403` | Authenticated but not an admin on a `requireAdmin` route; not a student on enroll create/delete |

### Error messages

| Message | When |
|---------|------|
| `First name is required.` / `Last name is required.` | Missing or whitespace-only name on register |
| `Email is required.` | Missing email on register |
| `Enter a valid email address.` | Email fails the shared regex |
| `Username is required.` / `Password is required.` | Missing credential on register or login |
| `Password must be at least 8 characters.` | Password shorter than 8 on register |
| `Username is already taken.` | Username exists (case-insensitive) |
| `Email is already registered.` | Email exists |
| `Invalid username or password.` | Login failure — identical for unknown user and wrong password |
| `Unauthorized! No token provided.` | No `Authorization: Bearer` header |
| `Unauthorized! Invalid token.` | Signature invalid or no matching session row |
| `Unauthorized! Session expired.` | Session row past `expirationDate` |
| `Forbidden! Admin access required.` | Non-admin hit a `requireAdmin` route |
| `Forbidden! Student access required.` | Non-student POST/DELETE `/courses/enrollments`, or non-student `GET /courses/my-courses` or `GET /courses/my-sections` |
| `semesterId is required.` | `GET /courses/catalog/sections` without a numeric `semesterId` |
| `sectionId is required.` | POST enrollment without `sectionId` |
| `You are already enrolled in this section.` | Duplicate section enrollment |
| `You are already enrolled in another section of this course.` | Second section of the same course in the same semester |
| `This section is full.` | Enrollment count already equals capacity |
| `Section with id=${id} not found.` | Unknown section on enroll |
| `Enrollment with id=${id} not found.` | Missing or not-owned enrollment on drop |

### Catalog and enrollment — [Feature 6](../feature-6-enrollment-management.md)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/semesters` | Yes | List `{ id, name }` |
| `GET` | `/courses/catalog/sections?semesterId=N` | Yes | Sections in that semester, with `remainingSeats` and embedded `course` |
| `GET` | `/courses/enrollments` | Yes | Caller's enrollments; optional `?semesterId=N` |
| `POST` | `/courses/enrollments` | Yes (student) | Enroll caller in `{ "sectionId" }` |
| `DELETE` | `/courses/enrollments/:id` | Yes (student) | Drop an enrollment the caller owns |

**POST body:** `{ "sectionId": 12 }`  
**POST `201`:** `{ "id", "userId", "sectionId", "enrolledAt" }`  
A `userId` in the body is ignored.  
**DELETE `200`:** `{ "message": "Enrollment dropped." }`

Admin create/update/delete for catalog rows is not exposed here; Features 2, 3, and 5 own those writes.

### Enrolled courses — [Feature 7](../feature-7-student-course-listing.md)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/my-courses` | Yes (student) | Distinct catalogue courses the caller is enrolled in, `name` ascending |

**`200`:** `[{ "id", "name", "courseID", "description", "semesterOffered" }]`. `description` and `semesterOffered` are `null` when blank. No enrollments → `[]`. Admin → `403`. No token → `401`.

### Enrolled sections — [Feature 8](../feature-8-student-section-listing.md)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/courses/my-sections` | Yes (student) | Sections the caller is enrolled in, section `id` ascending |

**`200`:** `[{ "id", "sectionNumber", "semester", "courseID", "facultyId", "daysOfWeek", "startTime", "endTime" }]`. `semester` is the Feature 3 semester name. `courseID` is the catalogue course code. No enrollments → `[]`. Admin → `403`. No token → `401`. Two sections of the same course are two rows.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

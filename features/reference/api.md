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
| `403` | Authenticated but not an admin on a `requireAdmin` route |

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

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

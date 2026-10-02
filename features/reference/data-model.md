# Data Model Reference

**Current integrated state on `dev`.** Update when a feature that changes schema merges.

Sequelize models live in `backend/app/models/`; associations are wired in `models/index.js`.

## Tables

### `users` — [Feature 1](../feature-1-user-auth.md)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash (`SALT_ROUNDS = 10`) |
| `role` | STRING(20) | Required; `student` or `admin`; defaults to `student` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

`password` is excluded by a `defaultScope`, so it is never returned unless a query uses `User.unscoped()` — which only the login path does.

### `sessions` — [Feature 1](../feature-1-user-auth.md)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; signed JWT. Sized above the 255 default because a JWT overflows it |
| `email` | STRING | Required; copied from the owning user |
| `expirationDate` | DATE | Required; 24 hours after creation |
| `userId` | INTEGER FK | Required, references `users.id` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

A session row is deleted on logout, so a replayed token no longer resolves.

## Associations

- `User hasMany Session` (`foreignKey: userId`)
- `Session belongsTo User` (`foreignKey: userId`)

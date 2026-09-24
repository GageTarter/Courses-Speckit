# C4 Level 1 — System context

**courses** (the OC CS Speckit example application) stores each registered user's private lists and coursess in MySQL through a server API. There are no external SaaS dependencies.

```mermaid
C4Context
title System Context — courses

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Person(user, "Registered User", "Owns private lists and coursess.")
System(coursesApp, "courses", "Web application for private lists and coursess.")
SystemDb_Ext(mysql, "MySQL", "Application system of record.")

Rel(user, coursesApp, "Uses", "HTTPS")
Rel(coursesApp, mysql, "Reads and writes", "Sequelize")

UpdateRelStyle(user, coursesApp, $offsetY="-20")
UpdateRelStyle(coursesApp, mysql, $offsetX="15")
```

## Notes

- The courses system contains the Vue SPA and Express API; the [container diagram](./c4-container.md) expands that boundary.
- The API is the source of truth. Browser storage is only a session/UX hint.

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [ADR-0003](../adr/0003-mysql-relational-database.md)

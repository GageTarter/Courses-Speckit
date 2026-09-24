# C4 Level 2 — Containers

Monorepo split: browser SPA talks to a stateless REST API; API owns auth and `userId` scoping; MySQL holds rows.

```mermaid
C4Container
title Container Diagram — courses

Person(user, "Registered User", "Uses courses in a browser.")

System_Boundary(coursesApp, "courses") {
  Container(spa, "Web SPA", "Vue 3, Vuetify, axios", "Browser UI and UX-only route guards.")
  Container(api, "API", "Node.js, Express, Sequelize", "REST /courses — auth and ownership enforcement.")
  ContainerDb(db, "Database", "MySQL", "Users, sessions, lists, and coursess.")
}

Rel(user, spa, "Uses", "HTTPS")
Rel(spa, api, "JSON", "Bearer JWT")
Rel(api, db, "SQL", "Sequelize")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
UpdateRelStyle(user, spa, $offsetY="-20")
UpdateRelStyle(spa, api, $offsetY="-15")
UpdateRelStyle(api, db, $offsetX="15")
```

## Notes

- API routes are mounted under `/courses/`; authenticated requests carry a Bearer JWT backed by the Session table.
- The API assigns and scopes ownership from `req.user.id`; the browser never supplies a trusted owner ID.
- Dev ports: frontend `8082` · backend `3200`; CORS origin must match the SPA.

**Related:** [project-structure.mdc](../../.cursor/rules/project-structure.mdc) · [api.md](../../features/reference/api.md)

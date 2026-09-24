# Feature: Section Management

**Feature ID:** 5
**Branch pattern:** `feature/5-section-management`
**Status:** Draft
**Created:** 2026-09-23
**Input:** Let a signed-in admin create, read, update, and remove sections.
**Depends on:** [Feature 1 — User Authentication & Session Management](./feature-list.md)
[Feature 2 — Semester Management](./feature-list.md)
[Feature 3 — Course Management](./feature-list.md)
[Feature 4 — Faculty Management](./feature-list.md)

**Related:** [Feature 2 — Semester Management](./feature-list.md) 
[Feature 3 — Course Management](./feature-list.md) 
[Feature 4 — Faculty Management](./feature-list.md) 
[Feature 6 — Enrollemnt Management](./feature-list.md) 
[Feature 7 — Student Course Listing](./feature-list.md)
[Feature 8 — Section Student Listing](./feature-list.md)  

---

## User Stories

### US-5.1: Create a Section
**As a** signed-in user
**I want to** create a section with a section number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time.
**So that** I create a section to record an anvailable section. 

**Priority:** P1
**Independent test:** Submit the Add Section dialog and see the new section on the Section page
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: See only my own Sections
**As a** signed-in user
**I want to** see just the sections I created on the Sections page
**So that** my sections stay separate from other admins' sections. 

**Priority:** P1
**Independent test:** Sign in as one user and confirm the page lists only that user's sections.
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria


### US-5.3: Update a section's details
**As a** signed-in user
**I want to** change a section's number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time.
**So that** the section reflects how I want my section to look.

**Priority:** P1
**Independent test:** Change the section number, semester ID,course ID, faculty ID, and days of the week available with the start time and end time and confirmthe updated details are saved.
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Delete a Section
**As a** signed-in user
**I want to** delete a section I no longer want
**So that** my Sections page stays limited to sections that are available this semester.

**Priority:** P2
**Independent test:** Delete one section and confirm it disappears from the Sections page.
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Admin Users MUST be signed in to create, update, or delete a section.
- **FR-002**: The System MUST require `section number`, `semesterId`, `courseId`, `facultyId`,`daysOfweek`,`startTime` and `endTime` when creating a section.
- **FR-003**: The System MUST reject a create request that omits a required field with `400` and a message naming that field (for example `"Name cannot be empty for section!"`).
- **FR-004**: The System MUST set a new sections's owner from the authenticated session never from a `userId` supplied in the request body.
- **FR-005**: `startTime` and ` endTime` MUST represent the section’s start and end times in minutes from midnight and MUST define a valid time range within the day.
-**FR-006**:The system MUST require startTime to be earlier than endTime when creating or updating a section.
- **FR-007**: The section MUST list only sections owned by the signed admin.
- **FR-008**:  The users MUST be able to update `section number`, `semesterId`, `courseId`, `facultyId`,`daysOfweek`,`startTime` and `endTime` they own. 
- **FR-009**:The system MUST return `400` when startTime is equal to or later than endTime.
- **FR-010**: The Sections page MUST display the section number, semester, course, faculty, days of the week, start time, and end time for each section.
- **FR-011**: The System MUST NOT let a user read, update, or delete a section owned by another user; such a request MUST return `404` with `` `Cannot find section with id=${id}.` `` rather than `403`.
- **FR-012**: The system MUST return `404` with `` `Cannot find Section with id=${id}.` `` when the requested section does not exist.
- **FR-013**: Deleting a section MUST also remove that sections's details,leaving no orphaned rows.
- **FR-014**:The system MUST use the authenticated user’s identity when determining which sections they can view, update, or delete.
**FR-015**The Sections page MUST let the owner delete a section only after they confirm in a dialog that names the section; cancelling MUST send no request and MUST leave the section listed.

## Assumptions
- Feature 1 authentication and session handling MUST be merged to `dev` before implementing this feature.
- Only authenticated users with admin privileges can access Section Management.
-The admin’s identity is available through the authenticated session.
-Sections are associated with an existing semester, course, and faculty member.
-Section numbers are unique for each course and semester.
-startTime and endTime represent times during the day and use the system’s supported time format.
-Admins can view, create, update, and delete sections according to the application’s authorization rules.


## Edge Cases
- An unauthenticated user attempts to access Section Management → redirect or `401`.
- An authenticated user without admin privileges attempts to access Section Management → `403`.
-The admin’s session is missing, expired, or contains an invalid identity → redirect or `401`.
- A section references a semester, course, or faculty member that does not exist → `400 `or `404`.
- A section number is missing, invalid, or contains an unsupported format → `400`.
-A section contains invalid or unexpected input, such as excessively long text or unsupported characters → client block and/or `400`.


# Quality and release record

Recorded 31 October 2026. This record distinguishes local verification from deployment readiness.

## Executed checks

| Check | Recorded result |
| --- | --- |
| Client service/session unit tests | 15 passed. |
| Backend authentication, authorization and persistence integration tests | 25 passed in isolated temporary data. |
| Isolated six-role HTTP system suite | 121 checks passed across SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT and STAFF. |
| Local HTTP system smoke | 12 passed against `http://localhost:4000/api` using the staff demo. |
| Client TypeScript and production bundle | Passed. Three.js and charts are split from the application bundle. |
| Root/client dependency audit | Zero known vulnerabilities after compatible patch updates. |
| Server dependency audit | Zero known vulnerabilities after compatible patch updates. |

The system smoke verified health, anonymous rejection, staff login, current identity, leave/events/announcements/transport/notifications reads, and denied staff access to users/students/payroll. It only generated normal sign-in audit entries. Backend tests additionally exercise write persistence, leave approval, notification state ownership and password/token rotation.

Browser checks confirmed the homepage and 3D scene at desktop and mobile widths, theme switching, campus keyboard tabs, mobile menu anchors, staff login, the staff dashboard, the leave dialog and staff category filtering. Screenshots are included with the handoff. Native date-entry automation in the embedded browser could not complete the leave form; the leave write/approval/persistence lifecycle is covered by API tests. This does not constitute cross-browser or live production acceptance.

Lint completes with no errors and reports existing warnings. Lighthouse/Core Web Vitals, concurrent load, real-email delivery and backup restoration have not been measured. The large Three.js chunk is lazy-loaded; operational routes are split into separate bundles.

## Repairs relevant to acceptance

- Pending, rejected and disabled users no longer approve themselves by signing in.
- Production requires a private signing key and a persistent database; development seeds cannot run in production.
- Academic records, linked children, notifications, staff administration and financial operations enforce server-side role/ownership checks.
- The client waits for server session validation before showing a protected workspace, reacts to expired sessions, and handles proxy/network errors.
- Staff teams include technicians, IT support, laboratory support, maintenance, housekeeping, security, transport, office, library and health support. The internal directory excludes salary, banking, PAN and payroll data. Administrators can classify, edit and reversibly archive personnel records.
- Approval/rejection actions only accept pending requests; school administrators cannot use them to disable executive accounts.
- Shared operational forms now have named dialogs, associated field labels, focus containment, Escape dismissal, scroll locking and focus return. Event registration no longer claims to generate a digital pass.
- Settings now changes the actual password with current-password verification and session revocation; it no longer shows simulated success.
- Reports render current API aggregates and export actual CSV data; simulated certified-report buttons have been removed.
- Assessment uploads are limited to 2 MB in the browser to fit the deployed API payload budget.
- Setup, builds, unit/integration tests, system smoke and dependency auditing have repeatable commands and CI configuration.

## Deployment blocker observed

A secure attempt to provision one new real STAFF account against the existing Vercel-linked Neon database failed before any database mutation. PostgreSQL returned code `53000`:

> Your account or project has exceeded the quota. Upgrade your plan to increase limits.

No new production account was created, and no generated unused password is supplied as a working login. The owner must restore capacity on the existing database or configure an alternative database before production API behavior can be verified. No paid resource or plan change was made.

A distinct sensitive `JWT_SECRET` was configured for preview deployments only. The existing production signing secret was left unchanged. Existing database environment metadata covers development, preview and production; isolate staging data before write testing.

## Remaining release evidence

- Successful production/staging PostgreSQL connection and a verified real staff login.
- Browser acceptance for each role, including the institution's actual profiles and class/child links.
- Representative assessment create/start/submit/grade and transport/payroll write flows with institution-approved test records.
- Measured concurrent load, backup restoration, monitoring/alerts and recovery ownership.
- Final deployment URL, tested commit and rollback reference.

The local demo is usable for design review. Client submission as a live production system remains dependent on the database blocker and the acceptance evidence above.

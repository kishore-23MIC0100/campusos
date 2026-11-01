# Quality and release record

Updated 1 November 2026. This record distinguishes local verification from deployment readiness.

## Executed checks

| Check | Recorded result |
| --- | --- |
| Client service/session, schedule and assessment-state unit tests | 21 passed. |
| Backend authentication, authorization, demo-family and persistence integration tests | 42 passed in isolated temporary data. |
| Isolated six-role HTTP system suite | 121 checks passed across SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT and STAFF. |
| Shared portal account verification | 39 local checks passed: login and current identity for six roles, audit retrieval and password exclusion. |
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

## Prior database outage

A secure attempt to provision one new real STAFF account against the existing Vercel-linked Neon database failed before any database mutation. PostgreSQL returned code `53000`:

> Your account or project has exceeded the quota. Upgrade your plan to increase limits.

No new production account was created, and no generated unused password is supplied as a working login. This quota failure blocked the earlier release verification. On 1 November 2026, the production health endpoint returned HTTP 200 with PostgreSQL healthy. The previous failure no longer reproduces at the latest health probe. No paid resource or plan change was made.

A distinct sensitive `JWT_SECRET` was configured for preview deployments only. The existing production signing secret was left unchanged. Existing database environment metadata covers development, preview and production; isolate staging data before write testing.

## Remaining release evidence

- Successful production/staging PostgreSQL connection and a verified real staff login.
- Browser acceptance for each role, including the institution's actual profiles and class/child links.
- Representative assessment create/start/submit/grade and transport/payroll write flows with institution-approved test records.
- Measured concurrent load, backup restoration, monitoring/alerts and recovery ownership.
- Final deployment URL, tested commit and rollback reference.

The local demo is usable for design review. Client submission as a live production system still requires the institutional acceptance and operational evidence above.
## Shared portal account update

The owner requested one email/password across all portals and explicitly chose to retain existing accounts. This is implemented as six independent, database-backed role identities. A sensitive server-only configuration stores a bcrypt hash and revision; neither the requested password nor the account identifier is committed to source. Local provisioning, all six logins and the updated audit page were verified. General registration and password-change length rules are unchanged; only the operator provisioning command accepts an explicitly confirmed password of at least eight characters.

New tests cover configuration validation, six-role login isolation, preserving other users, idempotence, later account-status/password changes, credential rotation and session revocation, failed/blocked login auditing, secret exclusion and duplicate-role detection. Provisioning on production activates only after PostgreSQL becomes available; it never bypasses database failures. Existing audit history remains intact.


## Scholaxys visual and portal update

The visible product name is Scholaxys. The workspace and assessment portal share midnight navy, electric lime and semantic status tokens, with a persistent light/dark toggle. The administration sign-in has no Staff switch; staff uses its dedicated portal. Existing URLs, database keys and session configuration remain compatible.

The local review accounts have two clearly fictional linked students, recent attendance, subject scores, assignments, weekday schedules, notifications and four assessment formats. The seeder is idempotent, preserves linked academic profiles and refuses production, Vercel and all PostgreSQL connections. The parent dashboard switches between both students. A student cannot use the parent family endpoint even when both role accounts share the same email.

The assessment library, question workspace, timer, code/written response editors, upload flow, grading status and result display have been redesigned. Zero-mark results are treated as completed rather than open work. Browser verification covered dark/light themes, desktop and mobile layouts, a quiz start/answer/submit cycle with a persisted 10/10 result, parent child switching and the administration login. Performance, load and institutional production acceptance remain unmeasured; the Neon quota prevented live backend acceptance at that release. The follow-up health probe on 1 November returned healthy; live role checks are recorded in the release handoff.


## Workspace UI consistency fixes

The follow-up UI audit fixes the reported white table headers in dark mode, low-contrast banner headings, mismatched primary buttons and status pills. Shared page headers now cover students, homework, faculty assessments, transport and payroll. Legacy modules map foregrounds and surfaces separately to the same semantic theme; white text no longer uses the active page surface as its foreground.

The student directory derives missing attendance from recorded registers and shows missing GPA/contact fields honestly. Homework submission and grading counts use the real class roster and latest submissions, including legacy student identifiers. Written responses are stored without inventing an attached PDF. Empty teacher allocations are shown accurately. Payroll totals use the same month, year, department, status and search filters as the ledger.

Five operational dialogs now share focus containment, Escape handling, scroll limits and labeled inputs. Page navigation resets the scroll position. Mobile form columns and transport tabs adapt to narrow screens. Regression evidence includes 21 client tests, 42 backend tests, 121 isolated role checks, builds and dependency audits. The browser sweep covers 23 workspace routes in both themes, plus the five reported pages at a mobile breakpoint. Computed contrast screening excludes images/gradients, SVG chart text and disabled controls; it is not a complete accessibility certification.

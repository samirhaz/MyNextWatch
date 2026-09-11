# Verification record

Verified locally on **12 September 2026** using Windows, Node.js 22.13.1, installed Google Chrome, and an isolated **MySQL Community Server 8.4.11** instance bound to localhost:3307. No production database or real account credentials were used.

## Executed checks

| Check                                                     | Result                                                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Clean dependency installation from the committed lockfile | Passed; Prisma client generated                                                                      |
| ESLint                                                    | Passed                                                                                               |
| TypeScript strict checks                                  | Passed, including the production build's type check                                                  |
| Unit tests                                                | **23 passed** across validation, filtering, request boundaries, and disposable-database safeguards   |
| MySQL integration tests                                   | **11 passed**; both committed migrations applied successfully                                        |
| Production build                                          | Passed with Next.js 16.3.5                                                                           |
| Browser scenarios                                         | **7 passed**: six demo/unauthenticated scenarios and one database-backed scenario                    |
| axe accessibility scans                                   | No WCAG 2 A/AA or WCAG 2.1 AA violations reported on the tested desktop dashboard and mobile library |
| Dependency audit                                          | **0 vulnerabilities** reported by npm for the final locked dependency versions                       |

The MySQL tests verify rating limits and CHECK constraints, concurrent duplicate prevention, ownership enforcement, private list access, custom-list membership, separate movie/TV identifiers, sharing and revocation, persistence through a new database connection, progress, long title names, saved country preferences, and concurrent rate-limit enforcement.

The database-backed browser scenario uses real Auth.js database sessions for two synthetic users. It verifies saved titles survive a page refresh, another user cannot change private entries or lists, anonymous users cannot read private lists, shared responses omit private notes and email, public links reject mutations, visitors can save to their own library, regenerated/revoked links stop working, and removing list membership preserves a library rating. It also verifies catalog loading, errors, and successful retry using explicitly intercepted test responses.

The demo browser scenarios verify list creation and title removal, demo reset on reload, rating editing/removal, private-note input, status controls, URL filtering, filtered random picks, empty results, missing posters, keyboard navigation, mobile navigation, reduced motion, and horizontal overflow. Screenshots were captured at **1440 × 1100** and **390 × 844** viewports with full-page capture, and visually inspected. Poster images loaded successfully; long card titles wrap within the grid.

- [Desktop screenshot](screenshots/dashboard-desktop.png)
- [Mobile screenshot](screenshots/dashboard-mobile.png)

Initial browser runs exposed a transient Chrome network change and test selectors that needed to distinguish select labels and Next.js's route announcement. The screenshot helper was also updated to load off-screen images before capture. All affected scenarios passed after correction; the database scenario was rerun separately after its final selector correction. These are actual application screenshots, using the clearly labeled sample demo.

## Requires owner setup

- Real GitHub OAuth authorization and callback, including sign-in across devices.
- Live authenticated TMDB search, metadata, and regional provider calls with the owner's read access token. Browser catalog error/retry fixtures do not verify TMDB connectivity.
- Hosted MySQL, Vercel deployment, and scheduled maintenance execution on Vercel.
- Check the GitHub Actions result after each push; local passing results do not establish that a remote CI run has passed.

No authentication bypass exists in the application: test sessions are inserted only by the guarded test process into the disposable database. Demo changes are intentionally temporary. Automated accessibility checks cover the listed pages and supplement visual/keyboard inspection; they are not a complete screen-reader audit.

See [Windows setup](SETUP-WINDOWS.md) and [deployment](DEPLOYMENT.md) for activation and verification steps.

## Local account setup

The owner's Windows workspace now has a separate MySQL database named `mynextwatch` on localhost:3306, with both migrations applied. Its data is in ignored `.local/mysql-dev-data`; preserve that directory if it contains real library data. Random database/application secrets are stored only in ignored local configuration. The disposable test database remains separate on port 3307.

`Start-MyNextWatch.cmd` was exercised on this Windows machine: it started the local MySQL instance and opened the existing website in Chrome. Fresh clones still need dependency installation and their own MySQL configuration. First successful GitHub OAuth sign-in creates an account; this requires the owner's Client ID and client secret in `.env`.

The supplied GitHub origin is `https://github.com/samirhaz/MyNextWatch.git`. Git commit identity uses the verified `samirhaz` account's GitHub noreply address.

# Windows and VS Code setup

## Open the project

Install Node.js 24 LTS, Git for Windows, and VS Code. Node.js 22.13 or newer in the 22.x series also works. This project includes a lockfile; use `npm ci` to reproduce its package versions.

In VS Code choose **File → Open Folder** and open `MNW`. Open **Terminal → New Terminal**. PowerShell commands below run from that folder.

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Visit `http://localhost:3000/demo/dashboard`. This works without credentials. If your PowerShell execution policy blocks `npm.ps1`, use `npm.cmd` for the npm commands instead of changing your system execution policy.

Demo edits are temporary and reset on refresh. They never write to MySQL or real accounts.

For a convenient Windows launch, double-click **Start-MyNextWatch.cmd** in the project folder. It opens Chrome at `http://localhost:3000/signin`. If it starts the development server, keep the terminal open and use **Ctrl+C** to stop it. If the website is already running, the launcher opens that instance. After changing credentials, restart the running server to load them.

If this workspace already has `.env` and `.local/mysql-dev-data` from local account setup, keep those files and use the launcher; you do not need Docker for that prepared instance. Never replace an existing `.env` with the example. The `.local/mysql-dev-data` directory contains your real local library once you sign in; back it up before moving or cleaning the project.

## Local MySQL with Docker Desktop

Install Docker Desktop using its official Windows instructions and enable its Linux-container backend. Start Docker Desktop, then run:

```powershell
docker compose up -d --wait mysql
npm run db:migrate
npm run dev
```

The example `DATABASE_URL` matches the local Compose database. Compose binds MySQL to localhost only and stores development data in the `mysql_data` volume. `docker compose stop mysql` stops it without removing your library. The example passwords are local development values, not production credentials.

For disposable database tests:

```powershell
docker compose --profile test up -d --wait mysql-test
npm run test:db
npm run build
npx playwright install chromium
npm run test:e2e:db
```

`mysql-test` uses a different port and temporary storage. Keep `TEST_DATABASE_URL` separate from `DATABASE_URL`; its database name must end in `_test`. Test scripts apply committed migrations and delete only the fixtures they create. They do not drop or reset a database.

## An existing MySQL installation

Use MySQL 8.4 LTS. Connect through MySQL Workbench or the MySQL command-line client as an administrator. Create an application database and user:

```sql
CREATE DATABASE mynextwatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mnw'@'localhost' IDENTIFIED BY 'REPLACE_WITH_YOUR_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON mynextwatch.* TO 'mnw'@'localhost';
```

Set `DATABASE_URL` in your untracked `.env`:

```dotenv
DATABASE_URL="mysql://mnw:URL_ENCODED_PASSWORD@127.0.0.1:3306/mynextwatch"
```

Use a URL-encoded password if it contains characters such as `@`, `#`, `/`, or `:`. Apply migrations with `npm run db:migrate`. Do not use the MySQL root account in the application. For a remote server, create a properly restricted database user according to your hosting provider's instructions and enable TLS.

For tests, create `mynextwatch_test` and a separate user with permissions limited to that database. Populate `TEST_DATABASE_URL` and run the test commands above.

## Credentials

| Variable                 | How to obtain it                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Local Compose example or the connection information from your MySQL host                             |
| `DATABASE_POOL_SIZE`     | Start at `2` per application instance; choose based on the host's connection limit                   |
| `DATABASE_SSL`           | `false` for localhost; `true` for remote production MySQL                                            |
| `DATABASE_SSL_CA`        | Optional PEM CA certificate supplied by your database host; certificate verification remains enabled |
| `AUTH_SECRET`            | Generate 32 random bytes locally using the command below                                             |
| `AUTH_URL`               | `http://localhost:3000` locally; your exact deployed HTTPS origin in production                      |
| `AUTH_GITHUB_ID`         | GitHub OAuth App's Client ID                                                                         |
| `AUTH_GITHUB_SECRET`     | A client secret generated for that OAuth App                                                         |
| `TMDB_READ_ACCESS_TOKEN` | TMDB account → Settings → API → API Read Access Token                                                |
| `CRON_SECRET`            | A separate random secret for the daily Vercel maintenance endpoint                                   |
| `TEST_DATABASE_URL`      | A dedicated disposable MySQL database ending in `_test`; never your real library database            |

Generate each secret separately:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the result only into `.env` or your hosting dashboard. Never commit it or put it into a `NEXT_PUBLIC_` variable. Restart `npm run dev` after changing environment variables.

## GitHub OAuth login

In GitHub open **Settings → Developer settings → OAuth Apps → New OAuth App**:

- Application name: `MyNextWatch Local`
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Register the application, generate a client secret, and copy the Client ID and secret into your untracked `.env`. For deployment, create a separate OAuth App using your production URL and its matching `/api/auth/callback/github` callback. The app requests `read:user user:email`, not repository permissions.

This OAuth App authenticates website users. It is separate from connecting your source code to GitHub.

## TMDB

Create a TMDB account, open **Settings → API**, request API access, and review the current terms. Copy the **API Read Access Token**, not the shorter v3 API key, into `TMDB_READ_ACCESS_TOKEN`. Discovery and provider information are fetched server-side. No TMDB user login is needed.

## Connect your source code to GitHub

Create an empty repository named **mynextwatch** on GitHub. Do not initialize it with a README or `.gitignore`; this project already has them. Copy the repository URL shown by GitHub.

In the VS Code terminal:

```powershell
git status
git remote -v
# Only if this folder is not already a Git repository:
git init -b main
# Only if Git says your name/email are not configured, set your own identity:
git config user.name "YOUR_NAME"
git config user.email "YOUR_GITHUB_EMAIL_OR_NOREPLY_ADDRESS"
git add .
git status
git diff --cached --stat
git commit -m "Build MyNextWatch movie and TV tracker"
# Only if no origin remote exists; paste the actual URL copied from GitHub:
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Before the commit, check that `.env`, `.local`, `.cache`, and `node_modules` are absent from staged files. `git check-ignore .env` should print `.env`. If `origin` already exists, inspect it instead of replacing it. No GitHub username or repository URL has been invented for you.

VS Code's **Source Control** panel shows changes and lets you commit with a message. A commit is a local snapshot; **push** uploads commits to your repository. For later changes: make a branch, edit, run the checks, commit, push, and open a pull request.

## Troubleshooting

- **ENOSPC / disk full:** free several GB before installing; dependencies, builds, and browser tools need space.
- **Cannot connect to MySQL:** confirm the server is running, host/port match, the database exists, and the user has access.
- **Tables missing:** run `npm run db:migrate` against the intended database.
- **OAuth callback error:** compare the callback URL character-for-character with the GitHub OAuth App setting. Restart the app after changes.
- **TMDB error:** check the read access token and network connection. Missing regional offers are not proof a title is unavailable everywhere.
- **Port 3000 in use:** stop the other process, or intentionally choose another port and update `AUTH_URL` and your OAuth callback to match.
- **Browser tests on Windows:** if Chromium is not installed but Chrome is, set `$env:PLAYWRIGHT_CHANNEL="chrome"` before running the browser tests.
- **Inside a restricted coding environment:** tools may need approval to download packages, start local servers, or launch browsers. A tool-approval or quota error is separate from an application failure.

Official references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Auth.js GitHub configuration](https://authjs.dev/getting-started/providers/github), [MySQL Windows installation](https://dev.mysql.com/doc/refman/8.4/en/windows-installation.html), [TMDB API FAQ](https://developer.themoviedb.org/docs/faq).

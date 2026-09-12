# Share the demo, keep your personal app

Your personal app runs at http://localhost:3000 using your existing `.env` and MySQL database.
Open `Start-MyNextWatch.cmd` when you want to use it. Leave `DEMO_ONLY` unset or `false` locally.

Publish a separate Vercel project for friends:

1. Sign in to https://vercel.com with GitHub.
2. Choose **Add New → Project** and import `samirhaz/MyNextWatch`.
3. Name the project `mynextwatch-demo` (or another available name). Keep the Next.js defaults.
4. Add just one environment variable: `DEMO_ONLY` = `true`, for Production and Preview.
5. Do not copy your local `.env` or add database, GitHub OAuth, TMDB, or maintenance secrets.
6. Deploy. Share the production domain shown under **Settings → Domains**, followed by `/demo/dashboard`.
7. Open that link in an incognito window to confirm friends can visit without Vercel login.
   If access is protected, adjust this demo project's Deployment Protection to allow public
   access to its production domain.

The production domain does not depend on your computer or a temporary tunnel. It remains usable
while the project and hosting account remain active and within the provider's terms and limits.
The actual domain is assigned by Vercel; do not assume a project name guarantees that URL.

In this deployment, the server blocks account/API routes and all write requests, and database
access is disabled even if credentials are accidentally configured. Demo changes live in each
visitor's browser memory and reset on refresh. Your personal app remains fully functional.

The existing maintenance cron is unnecessary for the demo; its route returns 404 in demo mode.
If the project is later used for the full app, configure production services separately and
remove `DEMO_ONLY=true` only after reviewing its account and privacy configuration.

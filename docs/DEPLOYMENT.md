# Deploy to Vercel with MySQL

Vercel hosts the Next.js application. It does not run the local Docker Compose MySQL service. Obtain a **separately hosted MySQL 8.4-compatible database** with TLS, backups, an appropriate connection limit, and a region close to your Vercel functions. No paid resource is provisioned by this repository.

## First deployment

1. Push the source to your own `mynextwatch` GitHub repository using the Windows guide.
2. Create your hosted MySQL database and an application user scoped to that database. Prefer a separate migration credential with DDL permissions; the runtime user needs CRUD and foreign-key access, not broad server administration.
3. Import the repository into Vercel as a Next.js project. Select Node.js 24. The build command is `npm run build`.
4. Add the variables from `.env.example` to Vercel's production environment. Set `AUTH_URL` to the exact production HTTPS origin, enable `DATABASE_SSL=true`, and supply a CA certificate if the host requires one. Keep `DATABASE_POOL_SIZE=2` initially. Add a separate randomly generated `CRON_SECRET`.
5. Create a production GitHub OAuth App with the exact homepage and callback `https://YOUR_ACTUAL_DOMAIN/api/auth/callback/github`. Put its client ID and secret into Vercel. Use a different OAuth App for localhost.
6. Add your server-only `TMDB_READ_ACCESS_TOKEN` and review TMDB's current usage terms.
7. Apply the committed migration to the intended production database **once, before opening the app to users**, from a trusted local terminal or controlled deployment job. Temporarily point your shell's `DATABASE_URL` to the host's migration connection string, then run `npm run db:migrate`. Do not print or commit the URL. Restore your local configuration afterward.
8. Deploy, sign in, save a title, refresh, sign out/in, and check the same account on another device. Test a share link in a private browser window, then revoke it and confirm the old URL fails.
9. Confirm the scheduled maintenance task succeeds in the Vercel Cron Jobs dashboard. It runs daily and requires `CRON_SECRET`; Vercel sends that secret in its Authorization header.

Do not run `prisma migrate dev`, destructive resets, integration tests, or demo seeding against production. Build does not automatically migrate a database, so parallel Vercel builds cannot race to perform schema changes.

## Connection limits

The pool is capped per warm application instance. Two connections multiplied by 30 simultaneous instances can still consume 60 database connections. Leave capacity for migrations, monitoring, and administration. Restrict concurrency and function scaling to the host's connection budget; use the host's MySQL-compatible pooling solution if needed. Do not use a PostgreSQL pooler such as PgBouncer for MySQL.

Connection and acquisition timeouts are explicit. TLS certificate validation remains enabled. Localhost can retrieve MySQL's authentication public key for local development; remote connections should use verified TLS.

## Environments and OAuth

Keep production, preview, local, and disposable test databases separate. Do not attach production credentials to untrusted preview deployments. GitHub OAuth callback URLs must match the deployed origin. A stable preview domain with a dedicated preview OAuth App is simpler than changing callbacks for every preview URL. Vercel is detected by Auth.js for trusted hosting; for another reverse proxy, follow Auth.js's deployment instructions instead of trusting arbitrary Host headers.

Set `AUTH_URL` consistently for the origin check. If you change domains, update Vercel environment variables and the OAuth callback, then redeploy.

## Operating the application

- Check logs for error classes; the application avoids logging credentials, notes, and complete user objects.
- Monitor MySQL connections, slow queries, storage, backup success, and the metadata cleanup task.
- Shared URLs are bearer credentials. Avoid analytics or logs that record complete share URLs. Responses use `Referrer-Policy: no-referrer`; shared pages are noindex and uncached.
- Request limits are stored in MySQL. The trusted client-IP header is used only on Vercel; local public requests share a conservative bucket. If moving platforms, adapt the trusted IP extraction deliberately.
- An interrupted availability refresh may have updated some titles. The UI reports failure rather than claiming the entire collection is fresh.
- Run `npm audit` when updating packages and inspect advisories rather than blindly forcing major upgrades.

Official references: [Auth.js deployment](https://authjs.dev/getting-started/deployment), [Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs), [Prisma MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql), [Vercel cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Deployment to Vercel + Supabase (free tier)

Goal
- Host the existing Next.js frontend on Vercel (free).
- Migrate / host Postgres on Supabase (free tier) and keep Prisma as ORM.
- Minimal changes to code: set `DATABASE_URL` to Supabase connection string and push schema.

Environment precedence used by this repository
- App runtime: `SUPABASE_DATABASE_URL` → `DATABASE_URL` → `DIRECT_URL` → legacy fallback vars.
- Prisma CLI / migrations: `DIRECT_URL` → `SUPABASE_DATABASE_URL` → `DATABASE_URL` → legacy fallback vars.
- Recommended setup for Supabase:
   - `SUPABASE_DATABASE_URL` = runtime/app connection string
   - `DATABASE_URL` = same runtime/app connection string for compatibility
   - `DIRECT_URL` = direct Postgres connection for `prisma db push`, restore, and maintenance scripts

Prerequisites
- Supabase account (create free project)
- Vercel account (free)
- Local Postgres client tools installed: `pg_dump`, `pg_restore` or `psql` and `pg_restore` (usually included with Postgres)
- Node.js environment (project already set up)
- `npx` available (Node)

High level steps
1. Create a Supabase project
   - In Supabase dashboard create a new project. Note the database connection string (connection string looks like `postgres://user:password@db.abcd.supabase.co:5432/postgres`).
   - Keep credentials safe.

2. Backup current database
   - If your current DB is accessible, run locally (replace source connection string):

```powershell
# Windows / PowerShell example
$SRC = "postgres://user:password@host:5432/dbname" # your current DB
pg_dump --format=custom --no-owner --no-privileges --dbname=$SRC --file=backup.dump
```

3. Restore to Supabase

```powershell
$SUPA = "postgres://postgres:SUPA_PASSWORD@db.abcd.supabase.co:5432/postgres"
# Using pg_restore
pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=$SUPA backup.dump
```

Notes: Supabase requires `sslmode=require` sometimes. If commands fail, use psql with `sslmode=require` in the connection string or use the Supabase SQL editor to run SQL.

4. Point Prisma to Supabase and push schema
- Prisma v7 note: the datasource URL is read from `prisma.config.ts` or passed via the CLI. Ensure `prisma.config.ts` uses `process.env.DATABASE_URL` (this project already includes that).
- Locally, set the env var for one-off commands and run push/generate:

```powershell
$env:DIRECT_URL = "postgres://postgres:SUPA_PASSWORD@db.abcd.supabase.co:5432/postgres?sslmode=require"
$env:SUPABASE_DATABASE_URL = "postgres://postgres:SUPA_PASSWORD@db.abcd.supabase.co:5432/postgres?sslmode=require"
$env:DATABASE_URL = $env:SUPABASE_DATABASE_URL
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --url=$env:DIRECT_URL
npx prisma generate
```

Alternatively, use the helper script to migrate and update `.env.local` in one go:

```powershell
.\scripts\migrate_to_supabase.ps1 -SourceUrl "postgres://user:pass@old-host:5432/postgres" -SupabaseUrl "postgres://postgres:SUPA_PASSWORD@db.abcd.supabase.co:5432/postgres?sslmode=require" -DirectUrl "postgres://postgres:SUPA_PASSWORD@db.abcd.supabase.co:5432/postgres?sslmode=require" -UpdateEnvFile
```

5. Configure Vercel
- In your Vercel project (connect repo), add Environment Variable `DATABASE_URL` with the Supabase connection string (use Vercel web UI).
- Add `SUPABASE_DATABASE_URL` with the same runtime connection string.
- Add `DIRECT_URL` with the direct connection string if you want CLI tasks and maintenance scripts to use it in hosted environments.
- For Sentry (to keep `/api/health` without warning in production), add:
   - `SENTRY_ENABLED` (`true` to require Sentry config in health check, `false` to intentionally disable Sentry without health warning)
   - `SENTRY_DSN` (server/edge)
   - `NEXT_PUBLIC_SENTRY_DSN` (browser)
   - `SENTRY_TRACES_SAMPLE_RATE` (e.g. `0.1`)
   - `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (e.g. `0.1`)
   - Optional for sourcemaps in CI/CD: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Also add any other secrets used by your app: `NEXTAUTH_URL`, `GITHUB_*`, etc.
- If you used other gestornavalpro_ env names, set them too or change your app to read `DATABASE_URL`.

6. Deploy
- Push to GitHub and let Vercel deploy, or use Vercel CLI:

```powershell
npm i -g vercel
vercel login
vercel --prod
```

7. Verify
- Call `/api/debug-db` and `/api/navios` endpoints to validate rows and connectivity.

Troubleshooting
- If counts are 0 after import: ensure you imported into the same schema (public) and that `pg_restore` used the right DB.
- If Prisma model missing error: run `npx prisma db push` and `npx prisma generate` on the same URL as deployed.
- CORS: If your APIs will be called from other hosts, configure CORS in API handlers or the host.

Optional: Supabase Auth
- If you want to replace custom auth, enable Supabase Auth and wire it on the frontend. This is optional — Prisma can keep using the Postgres DB for users.

Security
- Never commit production secrets. Use Vercel/env manager.

If you want, I can create a GitHub Actions workflow to automatically push Prisma and deploy using the Vercel CLI when you push to `main` (requires Vercel token and SUPABASE URL in GitHub secrets). Tell me if you'd like that created next.

# LADIRE Growth Forum — Website & Admin Console

Production codebase for the LADIRE Growth Forum web platform: a public marketing
site, member/participant flows, a paid online voting system for the **LADIRE
Youth & Entertainment Awards**, and a role-based admin console for running it
all.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
PostgreSQL (Prisma ORM, `@prisma/adapter-pg`) · NextAuth v5 · recharts ·
date-fns. Node 20+ required.

---

## What's inside

| Area | Location |
|---|---|
| Public site | `/`, `/events`, `/events/[slug]`, `/awards`, `/vote`, `/news`, `/join`, `/contact`, legal pages |
| User accounts | `/register` (phone + password), `/login` (password or Google), `/dashboard/*` |
| **Voting** | `/vote` — pick a nominee → bank-transfer order → upload proof of payment → wait for verification |
| **Admin console** | `/admin/login` → overview, payment verification, votes & revenue, users, members, registrations, bookings, events, awards/nominees/categories, announcements, banners, vacation programme, site settings, admin staff, audit log |
| CSV exports | `/admin/export/*` (users, members, payments, votes, registrations, bookings) |
| Schema + migrations | `prisma/` — PostgreSQL only (native enums, `text[]`, `Json`) |

Admin roles: `SUPER_ADMIN`, `ADMIN`, `PAYMENT_VERIFIER`, `CONTENT_MANAGER`.
Every destructive/sensitive admin action is written to the audit log.

---

## Local development

```bash
# 1. install (also runs `prisma generate` via postinstall)
npm install

# 2. configure environment
cp .env.example .env        # then fill in real values (see below)

# 3. create/apply the database
npx prisma migrate deploy   # applies prisma/migrations to your DATABASE_URL

# 4. create the first super-admin account (dev default shown below)
npm run db:seed             # or: node prisma/seed.mjs

# 5. run it
npm run dev                 # http://localhost:3000
```

Admin console sign-in (after `db:seed`) uses the credentials you explicitly provide through `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. The seed command refuses to run without a strong password.

```
URL:      http://localhost:3000/admin/login
Email:    value of SEED_ADMIN_EMAIL
Password: value of SEED_ADMIN_PASSWORD
```

---

## Environment variables

All documented in [`.env.example`](.env.example). The essentials:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (used by the app at runtime) |
| `DIRECT_URL` | Same DB without a pooler — used by `prisma migrate` |
| `AUTH_SECRET` | NextAuth signing secret — `openssl rand -base64 32` |
| `AUTH_URL` | Public base URL of the app |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google login |
| `NEXT_PUBLIC_SITE_URL` | Public URL (used for SEO/sitemap) |
| `APP_TIMEZONE` | Wall-clock zone for all date handling (default `Africa/Lagos`) |
| `STORAGE_DRIVER` / `STORAGE_DIR` | `auto` selects Vercel Blob on Vercel and local storage elsewhere |

Never commit `.env` (the `.gitignore` excludes it).

---

## File storage — read before you deploy ⚠️

`STORAGE_DRIVER=auto` is recommended. Local development uses `./storage`. When the app runs on Vercel, the storage facade automatically selects Vercel Blob. Use a **Private** Vercel Blob store for payment receipts and server-side reads; public media can use the public side of Blob.

Vercel Blob private storage supports authenticated server-side access and signed URLs. The project uses the server-side path for receipts so receipt credentials are never exposed as public static files.

Uploads are capped at 4 MB because Vercel-hosted server requests have a 4.5 MB body limit. If the project later needs larger uploads, move those uploads to a direct-to-Blob flow instead of increasing the server action limit.

For non-Vercel hosting, set `STORAGE_DRIVER=local` and point `STORAGE_DIR` at a persistent writable volume, or add another object-storage adapter behind `src/lib/storage.ts`.

## Deploying

### Option A — VPS / single Node instance (recommended, simplest with local storage)

```bash
git clone <your-repo> && cd ladire
npm install                          # runs prisma generate
npx prisma migrate deploy            # apply DB migrations
node prisma/seed.mjs                 # first-run admin account (optional)
npm run build
NODE_ENV=production npm run start    # port 3000; front with nginx/caddy + TLS
```

Keep the process alive with systemd or pm2. Uploaded files land in `./storage`
(override with `STORAGE_DIR`).

### Option B — Container (VPS with Docker)

A working `Dockerfile` + `.dockerignore` are included at the repo root (multi-stage,
non-root, includes its own Prisma migrate step via an init container or entrypoint).
Build with `docker build -t ladire .`, run with the env vars above and a mounted
volume for `/app/storage`.

### Option C — Vercel / serverless

1. Push the repo to GitHub and import into Vercel.
2. Add env vars from `.env.example` (set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `APP_TIMEZONE`).
3. **Storage caveat:** see the file-storage section above before going live.
4. Run migrations from your machine (`npx prisma migrate deploy`) or a one-off job against the same DB.

Any host: set `AUTH_URL` to the deployed origin and add its Google redirect URI
`{AUTH_URL}/api/auth/callback/google` if Google sign-in is used.

---

## Maintenance

```bash
npm run typecheck      # tsc --noEmit
npx prisma migrate dev # create a migration after editing prisma/schema.prisma (local)
npm run db:migrate     # apply migrations in production
npm run db:seed        # ensure a super-admin exists (idempotent)
```

After changing `prisma/schema.prisma`: run `npx prisma generate`, create a
migration locally, commit both, then `npm run db:migrate` on production before
deploying the new build.

## Production deployment notes

### Database

Use PostgreSQL/Neon. Set `DATABASE_URL` to the pooled Neon connection string and `DIRECT_URL` to the direct (non-pooler) Neon connection string. Do not commit either value.

Prisma is configured with the PostgreSQL driver adapter and the Rust-free `engineType = "client"` runtime, so the application does not depend on Prisma's native query-engine binary. Prisma migration commands still require a supported Prisma CLI environment; if Termux cannot run a migration command, apply migrations from a Linux/CI job against the same Neon database.

### File storage

`STORAGE_DRIVER=auto` is the recommended setting. Local development uses `./storage`; a Vercel deployment automatically selects Vercel Blob. Connect a **Private** Blob store to the Vercel project for payment receipts and keep public media separate from private receipts. Vercel Blob supports private objects and server-side authenticated reads. See the official Vercel Blob documentation before creating the production store.

The application limits server-side uploads to 4 MB so receipt and admin media uploads remain below Vercel's server request-body limit. For larger media, use a future direct-to-Blob client-upload flow rather than increasing the server action limit.

### Required production secrets/configuration

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET` (32+ random bytes)
- `ADMIN_AUTH_SECRET` (recommended: a separate 32+ byte random secret)
- `STORAGE_DRIVER=auto`
- Vercel Blob project/store connection (OIDC on newly connected Vercel projects, or `BLOB_READ_WRITE_TOKEN` where a static token is used)
- Optional Google OAuth credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Optional email provider configuration
- `NEXT_PUBLIC_SITE_URL` / `AUTH_URL` set to the production URL
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and optionally `SEED_ADMIN_NAME` only when intentionally running the seed command

Never use the demo bank account details for real voting. Replace them in **Admin → Settings** before enabling live voting.

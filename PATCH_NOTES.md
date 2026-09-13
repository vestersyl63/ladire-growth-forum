# LADIRE Growth Forum — Patch Notes

This package is the patched Arena export prepared for deployment.

## Included fixes

- Added a complete storage facade with local development storage and Vercel Blob support.
- Private payment receipts are stored/read through private storage rather than public static files.
- Added upload validation, MIME/magic-byte checks, path traversal protection and a 4 MB server-upload ceiling.
- Added Vercel Blob as the production storage dependency.
- Hardened admin session secret handling; no insecure hardcoded fallback remains.
- Removed the hardcoded seed-admin password. `SEED_ADMIN_PASSWORD` is now required and must be at least 12 characters.
- Tightened the WhatsApp payment-message action so one user cannot request another user's order details.
- Added editable demo bank defaults: GTBank / LADIRE Growth Forum / 1234567890. These are placeholders and must be replaced before live voting.
- Kept the configured LADIRE WhatsApp number as the default voting contact; it remains editable in Admin → Settings.
- Updated deployment documentation for Neon, Vercel and Vercel Blob.

## Important first install step

Because the patched project adds `@vercel/blob`, run `npm install` once after extracting this package. This refreshes `package-lock.json` with the Blob dependency before committing/deploying.

## Production requirements

1. Neon PostgreSQL `DATABASE_URL` and `DIRECT_URL`.
2. Fresh `AUTH_SECRET` and preferably a separate `ADMIN_AUTH_SECRET`.
3. A Vercel Blob store connected to the Vercel project. Prefer a Private store for receipts.
4. Real bank account details entered in Admin → Settings before live voting.
5. Real award categories/nominees/content entered through the admin console.
6. Google OAuth credentials only if Google login is wanted.
7. Rotate any database password that was previously pasted into chat before production.

Do not commit `.env` or any production secret.

## v3 verification fixes
- Prisma config now explicitly loads `.env` and does not make `DIRECT_URL` mandatory during `prisma generate`.
- `dotenv` is a direct runtime dependency because Prisma config imports `dotenv/config`.
- The public site layout is forced dynamic so database-backed pages are not prerendered during Android builds, avoiding Prisma native-engine execution at build time.
- Next.js workspace tracing root is explicitly set to the project directory.

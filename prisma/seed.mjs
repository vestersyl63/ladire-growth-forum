/* Minimal seed for local/dev: ensures an active SUPER_ADMIN exists so the
 * admin console can be signed into at /admin/login.
 *
 * Usage: node prisma/seed.mjs
 * Credentials come from env (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD) and fall
 * back to the development defaults printed at the end. Change the password
 * after first login.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env (simple parser tolerant of quoted values).
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  if (!process.env[key]) {
    try {
      const raw = readFileSync(path.join(__dirname, "..", ".env"), "utf8");
      const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (m) process.env[key] = m[1].trim().replace(/^"(.*)"$/, "$1");
    } catch {
      /* no .env — rely on ambient env */
    }
  }
}

const prisma = new PrismaClient();

const email = (process.env.SEED_ADMIN_EMAIL || "admin@ladire.org").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || "LADIRE Admin";

async function main() {
  if (!password || password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be set and contain at least 12 characters.");
  }
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  const hash = bcrypt.hashSync(password, 12);
  const admin = existing
    ? await prisma.adminUser.update({
        where: { email },
        data: { passwordHash: hash, name, status: "ACTIVE" },
      })
    : await prisma.adminUser.create({
        data: { email, name, passwordHash: hash, role: "SUPER_ADMIN", status: "ACTIVE" },
      });

  console.log(`\nAdmin console ready — sign in at /admin/login`);
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
  console.log(`  role:     ${admin.role} (status ${admin.status})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

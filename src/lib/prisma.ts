import { PrismaClient } from "@prisma/client";

// Use Prisma's standard engine-backed client for the Vercel deployment.
// Prisma 6's Rust-free query compiler can fail at runtime on Vercel when
// query_compiler_bg.wasm is omitted from the serverless bundle.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

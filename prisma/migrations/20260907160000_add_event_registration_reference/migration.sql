-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "reference" TEXT;

-- Backfill deterministic references for any existing rows (should be none in practice).
UPDATE "EventRegistration" SET "reference" = 'EVT-' || upper(substr(md5(random()::text), 1, 10)) WHERE "reference" IS NULL;

-- AlterTable
ALTER TABLE "EventRegistration" ALTER COLUMN "reference" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_reference_key" ON "EventRegistration"("reference");

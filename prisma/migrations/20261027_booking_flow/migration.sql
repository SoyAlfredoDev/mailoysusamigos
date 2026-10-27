-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "requestHash" TEXT;

-- CreateTable
CREATE TABLE "AppointmentNotice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" DATETIME,
    "sentAt" DATETIME,
    "providerId" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentNotice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AppointmentNotice_status_nextAttemptAt_idx" ON "AppointmentNotice"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "AppointmentNotice_appointmentId_idx" ON "AppointmentNotice"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "ListenEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resetsCount" INTEGER NOT NULL DEFAULT 0,
    "listenDurationMs" INTEGER NOT NULL DEFAULT 0,
    "timeToVibeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListenEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListenEvent_sessionId_key" ON "ListenEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ListenEvent_userId_idx" ON "ListenEvent"("userId");

-- AddForeignKey
ALTER TABLE "ListenEvent" ADD CONSTRAINT "ListenEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ListeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListenEvent" ADD CONSTRAINT "ListenEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

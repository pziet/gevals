-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "latencyMs" DOUBLE PRECISION,
    "costUsd" DOUBLE PRECISION,
    "bertScore" DOUBLE PRECISION,
    "semantic" DOUBLE PRECISION,
    "resultJson" JSONB,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

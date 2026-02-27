-- CreateTable
CREATE TABLE "ClientConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentDesc" TEXT NOT NULL DEFAULT '',
    "agentStatus" TEXT NOT NULL DEFAULT 'active',
    "industry" TEXT NOT NULL DEFAULT '',
    "deployedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "toolUsed" TEXT,
    "costUsd" REAL NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "pipelineRunId" TEXT,
    "clientId" TEXT NOT NULL DEFAULT 'client_001'
);

-- CreateTable
CREATE TABLE "ApprovalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "affectedSystem" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedAt" DATETIME,
    "decidedBy" TEXT,
    "note" TEXT,
    "clientId" TEXT NOT NULL DEFAULT 'client_001'
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "approvedBy" TEXT,
    "costUsd" REAL NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL,
    "clientId" TEXT NOT NULL DEFAULT 'client_001'
);

-- CreateTable
CREATE TABLE "PortalStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "actionsToday" INTEGER NOT NULL DEFAULT 0,
    "hoursSavedWeek" REAL NOT NULL DEFAULT 0,
    "pendingApprovals" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "totalActionsMonth" INTEGER NOT NULL DEFAULT 0,
    "totalCostMonth" REAL NOT NULL DEFAULT 0,
    "successRate" INTEGER NOT NULL DEFAULT 0,
    "exceptionsAutoResolved" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientConfig_clientId_key" ON "ClientConfig"("clientId");

-- CreateIndex
CREATE INDEX "ClientConfig_clientId_idx" ON "ClientConfig"("clientId");

-- CreateIndex
CREATE INDEX "ActivityEvent_timestamp_idx" ON "ActivityEvent"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityEvent_status_idx" ON "ActivityEvent"("status");

-- CreateIndex
CREATE INDEX "ActivityEvent_pillar_idx" ON "ActivityEvent"("pillar");

-- CreateIndex
CREATE INDEX "ActivityEvent_clientId_idx" ON "ActivityEvent"("clientId");

-- CreateIndex
CREATE INDEX "ApprovalItem_status_idx" ON "ApprovalItem"("status");

-- CreateIndex
CREATE INDEX "ApprovalItem_clientId_idx" ON "ApprovalItem"("clientId");

-- CreateIndex
CREATE INDEX "ApprovalItem_timestamp_idx" ON "ApprovalItem"("timestamp");

-- CreateIndex
CREATE INDEX "AuditEntry_timestamp_idx" ON "AuditEntry"("timestamp");

-- CreateIndex
CREATE INDEX "AuditEntry_status_idx" ON "AuditEntry"("status");

-- CreateIndex
CREATE INDEX "AuditEntry_clientId_idx" ON "AuditEntry"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalStats_clientId_key" ON "PortalStats"("clientId");

-- CreateIndex
CREATE INDEX "PortalStats_clientId_idx" ON "PortalStats"("clientId");

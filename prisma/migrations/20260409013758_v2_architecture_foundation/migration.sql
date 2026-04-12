-- CreateTable
CREATE TABLE "PipelineSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentStage" TEXT NOT NULL DEFAULT 'INITIATED',
    "agent1Output" TEXT,
    "agent2Output" TEXT,
    "agent3Output" TEXT,
    "agent4Output" TEXT,
    "agent5Output" TEXT,
    "agent6Output" TEXT,
    "gate1Decision" TEXT,
    "gate2Decision" TEXT,
    "gate3Decision" TEXT,
    "gate4Decision" TEXT,
    "gate5Decision" TEXT,
    "selectedProspects" TEXT,
    "selectedBookings" TEXT,
    "totalCostUsd" REAL NOT NULL DEFAULT 0,
    "totalDurationMs" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SubAgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subAgentId" TEXT NOT NULL,
    "parentAgentId" TEXT NOT NULL,
    "pipelineRunId" TEXT,
    "pipelineSessionId" TEXT,
    "clientId" TEXT NOT NULL,
    "taskProfile" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "providerUsed" TEXT NOT NULL,
    "taskCompleted" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "processingNotes" TEXT,
    "fallbacksUsed" TEXT,
    "escalationNeeded" BOOLEAN NOT NULL DEFAULT false,
    "escalationSeverity" TEXT,
    "escalationReason" TEXT,
    "costUsd" REAL NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubAgentRun_pipelineSessionId_fkey" FOREIGN KEY ("pipelineSessionId") REFERENCES "PipelineSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NurtureRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "vertical" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'warm',
    "reason" TEXT NOT NULL DEFAULT '',
    "originalPain" TEXT NOT NULL DEFAULT '',
    "whatWasTried" TEXT NOT NULL DEFAULT '[]',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "reQualified" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "lastTouch" DATETIME,
    "nextTouch" DATETIME,
    "touchCount" INTEGER NOT NULL DEFAULT 0,
    "signalsFound" TEXT,
    "lastProcessed" DATETIME,
    "sourceRunId" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceAgentId" TEXT NOT NULL,
    "sourceRunId" TEXT,
    "vertical" TEXT NOT NULL,
    "learningType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataPoints" INTEGER NOT NULL DEFAULT 1,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "significance" TEXT NOT NULL DEFAULT 'flag_only',
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "requiresPedroReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentLearning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vertical" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "learningType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "label" TEXT NOT NULL DEFAULT 'single_observation',
    "dataPoints" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearningDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentLearningId" TEXT NOT NULL,
    "targetAgentId" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningDistribution_agentLearningId_fkey" FOREIGN KEY ("agentLearningId") REFERENCES "AgentLearning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentMemoryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "pipelineRunId" TEXT,
    "memoriesRead" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClientPortfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'onboarding',
    "vertical" TEXT NOT NULL DEFAULT '',
    "retainerUsd" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weeklyHoursEstimate" REAL NOT NULL DEFAULT 0,
    "currentHealthScore" INTEGER NOT NULL DEFAULT 0,
    "previousHealthScore" INTEGER NOT NULL DEFAULT 0,
    "healthTrend" TEXT NOT NULL DEFAULT 'stable',
    "healthScoreHistory" TEXT NOT NULL DEFAULT '[]',
    "expansionReady" BOOLEAN NOT NULL DEFAULT false,
    "expansionReadySince" DATETIME,
    "expansionStage" TEXT,
    "expansionValueUsd" REAL NOT NULL DEFAULT 0,
    "hasOpenAlert" BOOLEAN NOT NULL DEFAULT false,
    "alertDescription" TEXT,
    "alertSeverity" TEXT,
    "portfolioGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientPortfolio_portfolioGroupId_fkey" FOREIGN KEY ("portfolioGroupId") REFERENCES "PortfolioGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupName" TEXT NOT NULL,
    "groupType" TEXT NOT NULL DEFAULT 'enterprise',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "managementFeeUsd" REAL NOT NULL DEFAULT 0,
    "portfolioDiscount" REAL NOT NULL DEFAULT 0.20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PortfolioPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekOf" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "description" TEXT NOT NULL DEFAULT '',
    "affectedClientIds" TEXT NOT NULL DEFAULT '[]',
    "verticalsAffected" TEXT NOT NULL DEFAULT '[]',
    "wasActedOn" BOOLEAN NOT NULL DEFAULT false,
    "pedroNotes" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BDRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'prospect',
    "currentStage" TEXT NOT NULL DEFAULT 'identified',
    "pipelineValueUsd" REAL NOT NULL DEFAULT 0,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "vertical" TEXT NOT NULL DEFAULT '',
    "lastContact" DATETIME,
    "nextAction" TEXT,
    "nextActionDue" DATETIME,
    "researchBriefId" TEXT,
    "referredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "committedTo" TEXT NOT NULL,
    "committedToType" TEXT NOT NULL DEFAULT 'client',
    "dueDate" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "deferredUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'P3',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "angle" TEXT NOT NULL DEFAULT '',
    "draftText" TEXT NOT NULL DEFAULT '',
    "sourceInsight" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "scheduledFor" DATETIME,
    "publishedAt" DATETIME,
    "performanceData" TEXT,
    "clientId" TEXT,
    "vertical" TEXT NOT NULL DEFAULT '',
    "sourceRunId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amountUsd" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "lastFollowUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClientCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "credentialKey" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "testConnectionPassed" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" DATETIME,
    "lastUsedAt" DATETIME,
    "addedByAgentId" TEXT NOT NULL DEFAULT 'agent-6-closer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "expiryDate" DATETIME,
    "alertSentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "requiresBAA" BOOLEAN NOT NULL DEFAULT false,
    "baaSignedAt" DATETIME,
    "documentRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PortalUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'view_only',
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PortalSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortalSession_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portalUserId" TEXT NOT NULL,
    "approvalEmail" BOOLEAN NOT NULL DEFAULT true,
    "approvalSms" BOOLEAN NOT NULL DEFAULT false,
    "approvalFrequency" TEXT NOT NULL DEFAULT 'immediate',
    "weeklyReportEmail" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReportDay" TEXT NOT NULL DEFAULT 'monday',
    "weeklyReportTime" TEXT NOT NULL DEFAULT '09:00',
    "healthAlertEmail" BOOLEAN NOT NULL DEFAULT true,
    "healthAlertThreshold" INTEGER NOT NULL DEFAULT 60,
    "p1AlertEmail" BOOLEAN NOT NULL DEFAULT true,
    "p1AlertSms" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'America/Puerto_Rico',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreference_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClientConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentDesc" TEXT NOT NULL DEFAULT '',
    "agentStatus" TEXT NOT NULL DEFAULT 'active',
    "industry" TEXT NOT NULL DEFAULT '',
    "deployedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ClientConfig" ("agentDesc", "agentName", "agentStatus", "clientId", "company", "createdAt", "deployedAt", "id", "industry", "name") SELECT "agentDesc", "agentName", "agentStatus", "clientId", "company", "createdAt", "deployedAt", "id", "industry", "name" FROM "ClientConfig";
DROP TABLE "ClientConfig";
ALTER TABLE "new_ClientConfig" RENAME TO "ClientConfig";
CREATE UNIQUE INDEX "ClientConfig_clientId_key" ON "ClientConfig"("clientId");
CREATE INDEX "ClientConfig_clientId_idx" ON "ClientConfig"("clientId");
CREATE INDEX "ClientConfig_userId_idx" ON "ClientConfig"("userId");
CREATE TABLE "new_PipelineRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leads" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "agentId" TEXT,
    "clientId" TEXT,
    "pipelineSessionId" TEXT,
    CONSTRAINT "PipelineRun_pipelineSessionId_fkey" FOREIGN KEY ("pipelineSessionId") REFERENCES "PipelineSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PipelineRun" ("cost", "duration", "id", "leads", "results", "runId", "status", "timestamp") SELECT "cost", "duration", "id", "leads", "results", "runId", "status", "timestamp" FROM "PipelineRun";
DROP TABLE "PipelineRun";
ALTER TABLE "new_PipelineRun" RENAME TO "PipelineRun";
CREATE UNIQUE INDEX "PipelineRun_runId_key" ON "PipelineRun"("runId");
CREATE INDEX "PipelineRun_timestamp_idx" ON "PipelineRun"("timestamp");
CREATE INDEX "PipelineRun_status_idx" ON "PipelineRun"("status");
CREATE INDEX "PipelineRun_clientId_idx" ON "PipelineRun"("clientId");
CREATE INDEX "PipelineRun_pipelineSessionId_idx" ON "PipelineRun"("pipelineSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PipelineSession_sessionId_key" ON "PipelineSession"("sessionId");

-- CreateIndex
CREATE INDEX "PipelineSession_clientId_idx" ON "PipelineSession"("clientId");

-- CreateIndex
CREATE INDEX "PipelineSession_status_idx" ON "PipelineSession"("status");

-- CreateIndex
CREATE INDEX "PipelineSession_currentStage_idx" ON "PipelineSession"("currentStage");

-- CreateIndex
CREATE INDEX "PipelineSession_createdAt_idx" ON "PipelineSession"("createdAt");

-- CreateIndex
CREATE INDEX "SubAgentRun_parentAgentId_idx" ON "SubAgentRun"("parentAgentId");

-- CreateIndex
CREATE INDEX "SubAgentRun_pipelineSessionId_idx" ON "SubAgentRun"("pipelineSessionId");

-- CreateIndex
CREATE INDEX "SubAgentRun_taskProfile_modelUsed_idx" ON "SubAgentRun"("taskProfile", "modelUsed");

-- CreateIndex
CREATE INDEX "SubAgentRun_clientId_idx" ON "SubAgentRun"("clientId");

-- CreateIndex
CREATE INDEX "SubAgentRun_createdAt_idx" ON "SubAgentRun"("createdAt");

-- CreateIndex
CREATE INDEX "NurtureRecord_nextTouch_idx" ON "NurtureRecord"("nextTouch");

-- CreateIndex
CREATE INDEX "NurtureRecord_archived_category_idx" ON "NurtureRecord"("archived", "category");

-- CreateIndex
CREATE INDEX "NurtureRecord_readinessScore_idx" ON "NurtureRecord"("readinessScore");

-- CreateIndex
CREATE INDEX "NurtureRecord_clientId_idx" ON "NurtureRecord"("clientId");

-- CreateIndex
CREATE INDEX "LearningEvent_vertical_learningType_idx" ON "LearningEvent"("vertical", "learningType");

-- CreateIndex
CREATE INDEX "LearningEvent_applied_idx" ON "LearningEvent"("applied");

-- CreateIndex
CREATE INDEX "LearningEvent_significance_idx" ON "LearningEvent"("significance");

-- CreateIndex
CREATE INDEX "LearningEvent_createdAt_idx" ON "LearningEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AgentLearning_vertical_learningType_idx" ON "AgentLearning"("vertical", "learningType");

-- CreateIndex
CREATE INDEX "AgentLearning_confidence_idx" ON "AgentLearning"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "AgentLearning_vertical_agentId_learningType_key_key" ON "AgentLearning"("vertical", "agentId", "learningType", "key");

-- CreateIndex
CREATE INDEX "LearningDistribution_targetAgentId_delivered_idx" ON "LearningDistribution"("targetAgentId", "delivered");

-- CreateIndex
CREATE INDEX "LearningDistribution_agentLearningId_idx" ON "LearningDistribution"("agentLearningId");

-- CreateIndex
CREATE INDEX "AgentMemoryLog_clientId_agentId_idx" ON "AgentMemoryLog"("clientId", "agentId");

-- CreateIndex
CREATE INDEX "AgentMemoryLog_createdAt_idx" ON "AgentMemoryLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortfolio_clientId_key" ON "ClientPortfolio"("clientId");

-- CreateIndex
CREATE INDEX "ClientPortfolio_stage_idx" ON "ClientPortfolio"("stage");

-- CreateIndex
CREATE INDEX "ClientPortfolio_vertical_idx" ON "ClientPortfolio"("vertical");

-- CreateIndex
CREATE INDEX "ClientPortfolio_expansionReady_idx" ON "ClientPortfolio"("expansionReady");

-- CreateIndex
CREATE INDEX "ClientPortfolio_portfolioGroupId_idx" ON "ClientPortfolio"("portfolioGroupId");

-- CreateIndex
CREATE INDEX "PortfolioPattern_weekOf_idx" ON "PortfolioPattern"("weekOf");

-- CreateIndex
CREATE INDEX "PortfolioPattern_wasActedOn_idx" ON "PortfolioPattern"("wasActedOn");

-- CreateIndex
CREATE INDEX "PortfolioPattern_severity_idx" ON "PortfolioPattern"("severity");

-- CreateIndex
CREATE INDEX "BDRecord_type_currentStage_idx" ON "BDRecord"("type", "currentStage");

-- CreateIndex
CREATE INDEX "BDRecord_nextActionDue_idx" ON "BDRecord"("nextActionDue");

-- CreateIndex
CREATE INDEX "Commitment_status_dueDate_idx" ON "Commitment"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Commitment_priority_idx" ON "Commitment"("priority");

-- CreateIndex
CREATE INDEX "ContentDraft_approvalStatus_idx" ON "ContentDraft"("approvalStatus");

-- CreateIndex
CREATE INDEX "ContentDraft_platform_idx" ON "ContentDraft"("platform");

-- CreateIndex
CREATE INDEX "ContentDraft_scheduledFor_idx" ON "ContentDraft"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_clientId_paymentStatus_idx" ON "Invoice"("clientId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateIndex
CREATE INDEX "ClientCredential_clientId_idx" ON "ClientCredential"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCredential_clientId_integrationType_credentialKey_key" ON "ClientCredential"("clientId", "integrationType", "credentialKey");

-- CreateIndex
CREATE INDEX "ComplianceRecord_clientId_idx" ON "ComplianceRecord"("clientId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_status_idx" ON "ComplianceRecord"("status");

-- CreateIndex
CREATE INDEX "ComplianceRecord_expiryDate_idx" ON "ComplianceRecord"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "PortalUser_email_key" ON "PortalUser"("email");

-- CreateIndex
CREATE INDEX "PortalUser_clientId_idx" ON "PortalUser"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSession_token_key" ON "PortalSession"("token");

-- CreateIndex
CREATE INDEX "PortalSession_portalUserId_idx" ON "PortalSession"("portalUserId");

-- CreateIndex
CREATE INDEX "PortalSession_token_idx" ON "PortalSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_portalUserId_key" ON "NotificationPreference"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitEntry_key_key" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

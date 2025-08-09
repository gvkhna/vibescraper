CREATE TABLE "crawlRun" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "extractionItem" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"extractionRunId" text NOT NULL,
	"payload" jsonb NOT NULL,
	"itemKey" text,
	"itemHash" text NOT NULL,
	"itemHashAlgo" text DEFAULT 'sha256' NOT NULL,
	"sequenceNumber" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extractionItem_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "extractionRun" (
	"id" text PRIMARY KEY NOT NULL,
	"httpResponseId" text NOT NULL,
	"extractorId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"extractedAt" timestamp DEFAULT now() NOT NULL,
	"durationMs" integer,
	"itemCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "extractor" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"projectId" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"script" text NOT NULL,
	"scriptLanguage" text DEFAULT 'javascript' NOT NULL,
	"settingsJson" jsonb DEFAULT '{"cleaningMethod":"filtered-html","htmlFilter":{"stripTags":["script","style","noscript","iframe","frame","frameset","noframes","svg","canvas","audio","video","source","track","embed","object","applet","map","textarea","input","textarea"],"preserveTags":[],"stripAttributes":[],"preserveAttributes":["id","role","tabindex","lang","dir","aria-*","href","hreflang","rel","target","src","alt","width","height","name","autocomplete","value","for","title"],"removeComments":true,"removeHead":false},"timeout":30000,"maxOutputSize":-1}'::jsonb NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extractor_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "httpResponse" (
	"id" text PRIMARY KEY NOT NULL,
	"crawlRunId" text NOT NULL,
	"projectUrlId" text NOT NULL,
	"statusCode" integer,
	"contentType" text NOT NULL,
	"headers" jsonb,
	"bodyHashAlgo" text DEFAULT 'sha256' NOT NULL,
	"bodyHash" text,
	"storageType" text NOT NULL,
	"body" text NOT NULL,
	"storageId" text,
	"responseTimeMs" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"subjectPolicyId" text NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "projectCommit" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"type" text DEFAULT 'initial' NOT NULL,
	"commitHash" text,
	"settingsJson" jsonb DEFAULT '{"schedule":"manual","fetchType":"fetch","crawler":{"followLinks":true,"maxDepth":3,"maxConcurrency":1,"requestTimeout":30000,"waitBetweenRequests":750,"successStatusCodes":[200],"respectRobotsTxt":true},"maxRetries":3,"retryDelay":5000}'::jsonb NOT NULL,
	"activeSchemaVersion" integer,
	"activeExtractorVersion" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projectCommit_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "projectSchema" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"projectId" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schemaJson" jsonb NOT NULL,
	"schemaType" text DEFAULT 'json_schema' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projectSchema_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "projectUrl" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "actor" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"type" text NOT NULL,
	"userId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actor_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "policyAuditEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"subjectPolicyId" text NOT NULL,
	"entry" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policyAuditEntry_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "subjectPolicy" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"policy" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjectPolicy_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "storage" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"filesize" bigint NOT NULL,
	"sha256hash" varchar(64) NOT NULL,
	"mimeType" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storage_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "projectChat" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"projectId" text NOT NULL,
	"title" text NOT NULL,
	"titleStatus" text DEFAULT 'initial' NOT NULL,
	"chatType" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projectChat_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "projectChatMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"projectChatId" text NOT NULL,
	"role" text NOT NULL,
	"index" integer NOT NULL,
	"content" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"idempotencyKeys" text[],
	"blocks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"usage" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projectChatMessage_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "apiKey" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"userId" text NOT NULL,
	"refillInterval" integer,
	"refillAmount" integer,
	"lastRefillAt" timestamp,
	"enabled" boolean DEFAULT false NOT NULL,
	"rateLimitEnabled" boolean DEFAULT false NOT NULL,
	"rateLimitTimeWindow" integer,
	"rateLimitMax" integer,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"lastRequest" timestamp,
	"expiresAt" timestamp,
	"permissions" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apiKey_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviterId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "jwk" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jwk_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"impersonatedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"plan" text NOT NULL,
	"referenceId" text NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"status" text NOT NULL,
	"periodStart" timestamp,
	"periodEnd" timestamp,
	"cancelAtPeriodEnd" timestamp,
	"seats" integer,
	"trialStart" timestamp,
	"trialEnd" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"name" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_publicId_unique" UNIQUE("publicId")
);

CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"secret" text,
	"backupCodes" text
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"publicId" text NOT NULL,
	"email" text,
	"emailVerified" boolean,
	"username" text,
	"displayUsername" text,
	"isGenerated" boolean DEFAULT false NOT NULL,
	"generatedFromSeed" text,
	"contentHash" text,
	"name" text,
	"image" text,
	"isAnonymous" boolean,
	"twoFactorEnabled" boolean,
	"stripeCustomerId" text,
	"avatarStorageId" text,
	"role" text,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" text,
	"banExpires" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_publicId_unique" UNIQUE("publicId"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "crawlRun" ADD CONSTRAINT "crawlRun_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extractionItem" ADD CONSTRAINT "extractionItem_extractionRunId_extractionRun_id_fk" FOREIGN KEY ("extractionRunId") REFERENCES "public"."extractionRun"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extractionRun" ADD CONSTRAINT "extractionRun_httpResponseId_httpResponse_id_fk" FOREIGN KEY ("httpResponseId") REFERENCES "public"."httpResponse"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extractionRun" ADD CONSTRAINT "extractionRun_extractorId_extractor_id_fk" FOREIGN KEY ("extractorId") REFERENCES "public"."extractor"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "extractor" ADD CONSTRAINT "extractor_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "httpResponse" ADD CONSTRAINT "httpResponse_crawlRunId_crawlRun_id_fk" FOREIGN KEY ("crawlRunId") REFERENCES "public"."crawlRun"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "httpResponse" ADD CONSTRAINT "httpResponse_projectUrlId_projectUrl_id_fk" FOREIGN KEY ("projectUrlId") REFERENCES "public"."projectUrl"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "httpResponse" ADD CONSTRAINT "httpResponse_storageId_storage_id_fk" FOREIGN KEY ("storageId") REFERENCES "public"."storage"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "project" ADD CONSTRAINT "project_subjectPolicyId_subjectPolicy_id_fk" FOREIGN KEY ("subjectPolicyId") REFERENCES "public"."subjectPolicy"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "project" ADD CONSTRAINT "project_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectCommit" ADD CONSTRAINT "projectCommit_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectCommit" ADD CONSTRAINT "projectCommit_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectSchema" ADD CONSTRAINT "projectSchema_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectUrl" ADD CONSTRAINT "projectUrl_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "actor" ADD CONSTRAINT "actor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "policyAuditEntry" ADD CONSTRAINT "policyAuditEntry_subjectPolicyId_subjectPolicy_id_fk" FOREIGN KEY ("subjectPolicyId") REFERENCES "public"."subjectPolicy"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectChat" ADD CONSTRAINT "projectChat_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projectChatMessage" ADD CONSTRAINT "projectChatMessage_projectChatId_projectChat_id_fk" FOREIGN KEY ("projectChatId") REFERENCES "public"."projectChat"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_user_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_activeOrganizationId_organization_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user" ADD CONSTRAINT "user_avatarStorageId_storage_id_fk" FOREIGN KEY ("avatarStorageId") REFERENCES "public"."storage"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "extractionItem_publicId_index" ON "extractionItem" USING btree ("publicId");
CREATE UNIQUE INDEX "extractionItem_extractionRunId_itemKey_index" ON "extractionItem" USING btree ("extractionRunId","itemKey") WHERE "extractionItem"."itemKey" IS NOT NULL;
CREATE UNIQUE INDEX "extractionRun_httpResponseId_extractorId_index" ON "extractionRun" USING btree ("httpResponseId","extractorId");
CREATE UNIQUE INDEX "extractor_projectId_version_index" ON "extractor" USING btree ("projectId","version");
CREATE UNIQUE INDEX "extractor_publicId_index" ON "extractor" USING btree ("publicId");
CREATE UNIQUE INDEX "httpResponse_crawlRunId_projectUrlId_index" ON "httpResponse" USING btree ("crawlRunId","projectUrlId");
CREATE UNIQUE INDEX "project_publicId_index" ON "project" USING btree ("publicId");
CREATE UNIQUE INDEX "projectCommit_publicId_index" ON "projectCommit" USING btree ("publicId");
CREATE UNIQUE INDEX "projectSchema_projectId_version_index" ON "projectSchema" USING btree ("projectId","version");
CREATE UNIQUE INDEX "projectSchema_publicId_index" ON "projectSchema" USING btree ("publicId");
CREATE UNIQUE INDEX "projectUrl_projectId_url_index" ON "projectUrl" USING btree ("projectId","url");
CREATE UNIQUE INDEX "actor_publicId_index" ON "actor" USING btree ("publicId");
CREATE UNIQUE INDEX "policyAuditEntry_publicId_index" ON "policyAuditEntry" USING btree ("publicId");
CREATE UNIQUE INDEX "subjectPolicy_publicId_index" ON "subjectPolicy" USING btree ("publicId");
CREATE UNIQUE INDEX "storage_publicId_index" ON "storage" USING btree ("publicId");
CREATE UNIQUE INDEX "projectChat_publicId_index" ON "projectChat" USING btree ("publicId");
CREATE UNIQUE INDEX "projectChatMessage_publicId_index" ON "projectChatMessage" USING btree ("publicId");
CREATE INDEX "account_userId_index" ON "account" USING btree ("userId");
CREATE UNIQUE INDEX "apiKey_publicId_index" ON "apiKey" USING btree ("publicId");
CREATE UNIQUE INDEX "jwk_publicId_index" ON "jwk" USING btree ("publicId");
CREATE UNIQUE INDEX "member_publicId_index" ON "member" USING btree ("publicId");
CREATE UNIQUE INDEX "organization_publicId_index" ON "organization" USING btree ("publicId");
CREATE INDEX "session_userId_index" ON "session" USING btree ("userId");
CREATE UNIQUE INDEX "team_publicId_index" ON "team" USING btree ("publicId");
CREATE UNIQUE INDEX "user_email_index" ON "user" USING btree ("email");
CREATE UNIQUE INDEX "user_publicId_index" ON "user" USING btree ("publicId");
CREATE UNIQUE INDEX "user_username_index" ON "user" USING btree ("username");
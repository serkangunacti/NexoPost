-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('free', 'basic', 'pro', 'agency', 'agency_plus');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "SubscriptionPhase" AS ENUM ('free', 'trial', 'paid');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "PublicationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED', 'BLOCKED_QUOTA', 'BLOCKED_X_BUDGET', 'BLOCKED_PLAN_ACCESS', 'BLOCKED_DAILY_CAP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "company_name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "active_workspace_id" TEXT,
    "superadmin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "PlanId" NOT NULL DEFAULT 'free',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
    "phase" "SubscriptionPhase" NOT NULL DEFAULT 'free',
    "has_used_trial" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "pending_plan" "PlanId",
    "pending_billing_cycle" "BillingCycle",
    "pending_effective_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT,
    "plan" "PlanId" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "discount_code_id" TEXT,
    "discount_percent" INTEGER,
    "status" "PaymentStatus" NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" JSONB,
    "page_id" TEXT,
    "page_name" TEXT,
    "page_access_token" TEXT,
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'CONNECTED',
    "metadata" JSONB,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platforms" JSONB NOT NULL,
    "platform_config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "auto_optimize" BOOLEAN NOT NULL DEFAULT false,
    "media_urls" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration_ms" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_variants" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_urls" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_jobs" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "social_account_id" TEXT,
    "platform" TEXT NOT NULL,
    "status" "PublicationJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "scheduled_for" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "last_error" TEXT,
    "quota_charged_at" TIMESTAMP(3),
    "quota_charge_units" INTEGER NOT NULL DEFAULT 0,
    "x_spend_charged_cents" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_results" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" "PublicationJobStatus" NOT NULL,
    "remote_id" TEXT,
    "remote_url" TEXT,
    "payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_usage_periods" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "plan" "PlanId" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "platform_jobs_included" INTEGER,
    "platform_jobs_used" INTEGER NOT NULL DEFAULT 0,
    "platform_jobs_blocked" INTEGER NOT NULL DEFAULT 0,
    "x_spend_cap_cents" INTEGER,
    "x_spend_used_cents" INTEGER NOT NULL DEFAULT 0,
    "x_spend_blocked_cents" INTEGER NOT NULL DEFAULT 0,
    "per_platform_monthly_counts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_usage_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_daily_usage" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" TEXT NOT NULL,
    "used_jobs" INTEGER NOT NULL DEFAULT 0,
    "blocked_jobs" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent_off" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "max_redemptions" INTEGER,
    "redeemed_count" INTEGER NOT NULL DEFAULT 0,
    "allowed_plans" JSONB,
    "allowed_billing_cycles" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_redemptions" (
    "id" TEXT NOT NULL,
    "discount_code_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "plan" "PlanId" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "percent_off" INTEGER NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_context" JSONB,

    CONSTRAINT "discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_rate_cards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "estimated_cost_cents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "x_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "workspace_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachment_urls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "last_user_read_at" TIMESTAMP(3),
    "last_staff_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_replies" (
    "id" TEXT NOT NULL,
    "support_request_id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "author_type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'PORTAL',
    "body" TEXT NOT NULL,
    "attachment_urls" JSONB,
    "external_message_id" TEXT,
    "seen_by_user_at" TIMESTAMP(3),
    "seen_by_staff_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_state_store" (
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_state_store_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "oauth_session_store" (
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_session_store_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces"("owner_id");

-- CreateIndex
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_workspace_id_platform_key" ON "social_accounts"("workspace_id", "platform");

-- CreateIndex
CREATE INDEX "posts_workspace_id_created_at_idx" ON "posts"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "media_assets_post_id_sort_order_idx" ON "media_assets"("post_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "post_variants_post_id_platform_key" ON "post_variants"("post_id", "platform");

-- CreateIndex
CREATE INDEX "publication_jobs_status_scheduled_for_idx" ON "publication_jobs"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "publication_jobs_workspace_id_created_at_idx" ON "publication_jobs"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "publication_results_job_id_key" ON "publication_results"("job_id");

-- CreateIndex
CREATE INDEX "publication_results_workspace_id_created_at_idx" ON "publication_results"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_usage_periods_workspace_id_period_start_period_en_key" ON "workspace_usage_periods"("workspace_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_daily_usage_workspace_id_date_platform_key" ON "workspace_daily_usage"("workspace_id", "date", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_is_active_expires_at_idx" ON "discount_codes"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "discount_redemptions_discount_code_id_redeemed_at_idx" ON "discount_redemptions"("discount_code_id", "redeemed_at");

-- CreateIndex
CREATE INDEX "discount_redemptions_user_id_redeemed_at_idx" ON "discount_redemptions"("user_id", "redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "x_rate_cards_code_key" ON "x_rate_cards"("code");

-- CreateIndex
CREATE INDEX "x_rate_cards_active_code_idx" ON "x_rate_cards"("active", "code");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_created_at_idx" ON "audit_logs"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "support_requests_user_id_created_at_idx" ON "support_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "support_requests_workspace_id_created_at_idx" ON "support_requests"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "support_requests_status_created_at_idx" ON "support_requests"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "support_replies_external_message_id_key" ON "support_replies"("external_message_id");

-- CreateIndex
CREATE INDEX "support_replies_support_request_id_created_at_idx" ON "support_replies"("support_request_id", "created_at");

-- CreateIndex
CREATE INDEX "support_replies_author_type_created_at_idx" ON "support_replies"("author_type", "created_at");

-- CreateIndex
CREATE INDEX "support_replies_seen_by_user_at_created_at_idx" ON "support_replies"("seen_by_user_at", "created_at");

-- CreateIndex
CREATE INDEX "oauth_state_store_provider_expires_at_idx" ON "oauth_state_store"("provider", "expires_at");

-- CreateIndex
CREATE INDEX "oauth_session_store_provider_idx" ON "oauth_session_store"("provider");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_workspace_id_fkey" FOREIGN KEY ("active_workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_variants" ADD CONSTRAINT "post_variants_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_jobs" ADD CONSTRAINT "publication_jobs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_jobs" ADD CONSTRAINT "publication_jobs_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_jobs" ADD CONSTRAINT "publication_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_results" ADD CONSTRAINT "publication_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "publication_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_results" ADD CONSTRAINT "publication_results_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_results" ADD CONSTRAINT "publication_results_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_usage_periods" ADD CONSTRAINT "workspace_usage_periods_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_daily_usage" ADD CONSTRAINT "workspace_daily_usage_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;


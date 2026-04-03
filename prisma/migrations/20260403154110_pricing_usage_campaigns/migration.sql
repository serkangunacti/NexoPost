-- AlterTable
ALTER TABLE `publication_jobs` ADD COLUMN `quota_charge_units` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `quota_charged_at` DATETIME(3) NULL,
    ADD COLUMN `x_spend_charged_cents` INTEGER NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED', 'BLOCKED_QUOTA', 'BLOCKED_X_BUDGET', 'BLOCKED_PLAN_ACCESS', 'BLOCKED_DAILY_CAP') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `publication_results` MODIFY `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED', 'BLOCKED_QUOTA', 'BLOCKED_X_BUDGET', 'BLOCKED_PLAN_ACCESS', 'BLOCKED_DAILY_CAP') NOT NULL;

-- CreateTable
CREATE TABLE `workspace_usage_periods` (
    `id` VARCHAR(191) NOT NULL,
    `workspace_id` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `billing_cycle` VARCHAR(191) NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `platform_jobs_included` INTEGER NULL,
    `platform_jobs_used` INTEGER NOT NULL DEFAULT 0,
    `platform_jobs_blocked` INTEGER NOT NULL DEFAULT 0,
    `x_spend_cap_cents` INTEGER NULL,
    `x_spend_used_cents` INTEGER NOT NULL DEFAULT 0,
    `x_spend_blocked_cents` INTEGER NOT NULL DEFAULT 0,
    `per_platform_monthly_counts` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workspace_usage_periods_workspace_id_period_end_idx`(`workspace_id`, `period_end`),
    UNIQUE INDEX `workspace_usage_periods_workspace_id_period_start_period_end_key`(`workspace_id`, `period_start`, `period_end`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_daily_usage` (
    `id` VARCHAR(191) NOT NULL,
    `workspace_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `used_jobs` INTEGER NOT NULL DEFAULT 0,
    `blocked_jobs` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workspace_daily_usage_workspace_id_date_idx`(`workspace_id`, `date`),
    UNIQUE INDEX `workspace_daily_usage_workspace_id_date_platform_key`(`workspace_id`, `date`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discount_codes` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `percent_off` INTEGER NOT NULL,
    `starts_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `max_redemptions` INTEGER NULL,
    `redeemed_count` INTEGER NOT NULL DEFAULT 0,
    `allowed_plans` JSON NULL,
    `allowed_billing_cycles` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `discount_codes_code_key`(`code`),
    INDEX `discount_codes_is_active_expires_at_idx`(`is_active`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discount_redemptions` (
    `id` VARCHAR(191) NOT NULL,
    `discount_code_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `plan` VARCHAR(191) NOT NULL,
    `billing_cycle` VARCHAR(191) NOT NULL,
    `percent_off` INTEGER NOT NULL,
    `redeemed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order_context` JSON NULL,

    INDEX `discount_redemptions_discount_code_id_redeemed_at_idx`(`discount_code_id`, `redeemed_at`),
    INDEX `discount_redemptions_user_id_redeemed_at_idx`(`user_id`, `redeemed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `x_rate_cards` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `estimated_cost_cents` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `x_rate_cards_code_key`(`code`),
    INDEX `x_rate_cards_active_code_idx`(`active`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workspace_usage_periods` ADD CONSTRAINT `workspace_usage_periods_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_daily_usage` ADD CONSTRAINT `workspace_daily_usage_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discount_redemptions` ADD CONSTRAINT `discount_redemptions_discount_code_id_fkey` FOREIGN KEY (`discount_code_id`) REFERENCES `discount_codes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

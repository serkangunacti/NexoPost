-- CreateTable
CREATE TABLE `posts` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `platforms` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `scheduled_at` DATETIME(3) NULL,
    `auto_optimize` BOOLEAN NOT NULL DEFAULT false,
    `media_urls` JSON NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `user_type` VARCHAR(191) NOT NULL DEFAULT 'basic',
    `active_client_id` VARCHAR(191) NULL,
    `clients` JSON NOT NULL,
    `connected_accounts` JSON NOT NULL,
    `subscription` JSON NULL,
    `pending_change` JSON NULL,
    `user_profile` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

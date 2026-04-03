CREATE TABLE `oauth_state_store` (
  `key` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`),
  INDEX `oauth_state_store_provider_expires_at_idx`(`provider`, `expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `oauth_session_store` (
  `key` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`),
  INDEX `oauth_session_store_provider_idx`(`provider`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

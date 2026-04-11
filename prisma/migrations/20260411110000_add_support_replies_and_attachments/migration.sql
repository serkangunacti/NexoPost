ALTER TABLE `support_requests`
  ADD COLUMN `attachment_urls` JSON NULL,
  ADD COLUMN `last_user_read_at` DATETIME(3) NULL,
  ADD COLUMN `last_staff_read_at` DATETIME(3) NULL;

CREATE TABLE `support_replies` (
  `id` VARCHAR(191) NOT NULL,
  `support_request_id` VARCHAR(191) NOT NULL,
  `author_user_id` VARCHAR(191) NULL,
  `author_type` VARCHAR(191) NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'PORTAL',
  `body` TEXT NOT NULL,
  `attachment_urls` JSON NULL,
  `external_message_id` VARCHAR(191) NULL,
  `seen_by_user_at` DATETIME(3) NULL,
  `seen_by_staff_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `support_replies_external_message_id_key`(`external_message_id`),
  INDEX `support_replies_support_request_id_created_at_idx`(`support_request_id`, `created_at`),
  INDEX `support_replies_author_type_created_at_idx`(`author_type`, `created_at`),
  INDEX `support_replies_seen_by_user_at_created_at_idx`(`seen_by_user_at`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `support_replies`
  ADD CONSTRAINT `support_replies_support_request_id_fkey`
    FOREIGN KEY (`support_request_id`) REFERENCES `support_requests`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `support_replies_author_user_id_fkey`
    FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `users`
ADD COLUMN `email` VARCHAR(191) NULL,
ADD COLUMN `hashed_password` VARCHAR(191) NULL,
ADD COLUMN `social_tokens` JSON NULL;

ALTER TABLE `users`
ADD UNIQUE INDEX `users_email_key`(`email`);

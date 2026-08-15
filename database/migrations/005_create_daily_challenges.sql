CREATE TABLE IF NOT EXISTS `daily_challenge_progress` (
  `user_id` VARCHAR(64) NOT NULL,
  `challenge_date` DATE NOT NULL,
  `challenge_id` VARCHAR(64) NOT NULL,
  `progress` INT UNSIGNED NOT NULL DEFAULT 0,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `claimed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`, `challenge_date`, `challenge_id`),
  KEY `daily_challenge_date_index` (`challenge_date`),
  CONSTRAINT `daily_challenge_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

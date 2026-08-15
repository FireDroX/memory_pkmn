CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(25) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `online_games_won` INT UNSIGNED NOT NULL DEFAULT 0,
  `shiny_pairs_found` INT UNSIGNED NOT NULL DEFAULT 0,
  `user_profile` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

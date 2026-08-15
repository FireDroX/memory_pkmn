ALTER TABLE `users`
  ADD COLUMN `online_games_played` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `online_games_won`,
  ADD COLUMN `online_games_lost` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `online_games_played`,
  ADD COLUMN `current_win_streak` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `online_games_lost`,
  ADD COLUMN `best_win_streak` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `current_win_streak`,
  ADD COLUMN `total_pairs_found` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `shiny_pairs_found`,
  ADD COLUMN `solo_games_played` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `total_pairs_found`,
  ADD COLUMN `solo_games_won` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `solo_games_played`,
  ADD COLUMN `solo_best_remaining_tries` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `solo_games_won`;

ALTER TABLE `rooms`
  ADD COLUMN `completed_at` TIMESTAMP NULL DEFAULT NULL AFTER `created_at`;

UPDATE `users`
SET `online_games_played` = `online_games_won`;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `role`,
  ADD KEY IF NOT EXISTS `users_active_index` (`is_active`);

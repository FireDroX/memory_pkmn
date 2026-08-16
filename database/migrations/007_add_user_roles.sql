ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER `password`,
  ADD KEY IF NOT EXISTS `users_role_index` (`role`);

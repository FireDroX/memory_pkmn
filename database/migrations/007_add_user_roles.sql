ALTER TABLE `users`
  ADD COLUMN `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER `password`,
  ADD KEY `users_role_index` (`role`);
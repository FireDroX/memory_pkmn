CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(64) NOT NULL,
  `players` JSON NOT NULL,
  `playerTurn` VARCHAR(25) NULL,
  `cards` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rooms_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `room_messages` (
  `id` VARCHAR(64) NOT NULL,
  `room_id` VARCHAR(64) NOT NULL,
  `author_id` VARCHAR(64) NOT NULL,
  `author_name` VARCHAR(25) NOT NULL,
  `message` VARCHAR(280) NOT NULL,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `room_messages_room_created_at_index` (`room_id`, `created_at`),
  CONSTRAINT `room_messages_room_fk`
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

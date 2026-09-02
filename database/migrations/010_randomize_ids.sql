SET FOREIGN_KEY_CHECKS = 0;

CREATE TEMPORARY TABLE `id_migration_users` (
  `old_id` VARCHAR(64) NOT NULL,
  `new_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`old_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `id_migration_users` (`old_id`, `new_id`)
SELECT
  `id`,
  CONCAT(
    'USER-',
    SUBSTRING(
      SHA2(CONCAT_WS('|', UUID(), RAND(), NOW(6), CONNECTION_ID(), `id`), 256),
      1, 32
    )
  )
FROM `users`;

CREATE TEMPORARY TABLE `id_migration_rooms` (
  `old_id` VARCHAR(64) NOT NULL,
  `new_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`old_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `id_migration_rooms` (`old_id`, `new_id`)
SELECT
  `id`,
  CONCAT(
    'ROOM-',
    SUBSTRING(
      SHA2(CONCAT_WS('|', UUID(), RAND(), NOW(6), CONNECTION_ID(), `id`), 256),
      1, 32
    )
  )
FROM `rooms`;

START TRANSACTION;

UPDATE `rooms` r JOIN `id_migration_users` m
  ON m.old_id = JSON_UNQUOTE(JSON_EXTRACT(r.players, '$[0].id'))
SET r.players = JSON_REPLACE(r.players, '$[0].id', m.new_id)
WHERE JSON_LENGTH(r.players) > 0;

UPDATE `rooms` r JOIN `id_migration_users` m
  ON m.old_id = JSON_UNQUOTE(JSON_EXTRACT(r.players, '$[1].id'))
SET r.players = JSON_REPLACE(r.players, '$[1].id', m.new_id)
WHERE JSON_LENGTH(r.players) > 1;

UPDATE `rooms` r JOIN `id_migration_users` m
  ON m.old_id = JSON_UNQUOTE(JSON_EXTRACT(r.players, '$[2].id'))
SET r.players = JSON_REPLACE(r.players, '$[2].id', m.new_id)
WHERE JSON_LENGTH(r.players) > 2;

UPDATE `rooms` r JOIN `id_migration_users` m
  ON m.old_id = JSON_UNQUOTE(JSON_EXTRACT(r.players, '$[3].id'))
SET r.players = JSON_REPLACE(r.players, '$[3].id', m.new_id)
WHERE JSON_LENGTH(r.players) > 3;

UPDATE `friendships` f JOIN `id_migration_users` m ON m.old_id = f.user_id
SET f.user_id = m.new_id;

UPDATE `friendships` f JOIN `id_migration_users` m ON m.old_id = f.friend_id
SET f.friend_id = m.new_id;

UPDATE `friendships` f JOIN `id_migration_users` m ON m.old_id = f.requested_by
SET f.requested_by = m.new_id;

UPDATE `daily_challenge_progress` d JOIN `id_migration_users` m ON m.old_id = d.user_id
SET d.user_id = m.new_id;

UPDATE `room_messages` rm JOIN `id_migration_users` m ON m.old_id = rm.author_id
SET rm.author_id = m.new_id;

UPDATE `room_messages` rm JOIN `id_migration_rooms` m ON m.old_id = rm.room_id
SET rm.room_id = m.new_id;

UPDATE `users` u JOIN `id_migration_users` m ON m.old_id = u.id
SET u.id = m.new_id;

UPDATE `rooms` r JOIN `id_migration_rooms` m ON m.old_id = r.id
SET r.id = m.new_id;

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;

DELETE FROM `sessions`;

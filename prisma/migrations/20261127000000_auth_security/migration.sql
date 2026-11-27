-- Authentication revocation and bounded database-backed rate limits.
ALTER TABLE `users`
  ADD COLUMN `session_version` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `login_rate_limits` (
  `key` VARCHAR(64) NOT NULL,
  `attempts` INTEGER NOT NULL,
  `reset_at` DATETIME(3) NOT NULL,
  CONSTRAINT `login_rate_limits_attempts_chk` CHECK (`attempts` >= 1),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
